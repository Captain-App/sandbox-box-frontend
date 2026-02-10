#!/usr/bin/env node
/**
 * Test script to debug realtime events
 *
 * This script:
 * 1. Gets admin auth token
 * 2. Creates a session
 * 3. Sends a task
 * 4. Connects to WebSocket to monitor events
 */

import WebSocket from 'ws';

const API_URL = process.env.API_URL || 'https://backend.shipbox.dev';
const ENGINE_URL = process.env.ENGINE_URL || 'https://engine.shipbox.dev';
const ADMIN_EMAIL = 'admin@captainapp.co.uk';

interface Session {
  id: string;
  sessionId: string;
  realtimeToken?: string;
  status: string;
}

async function getAdminToken(): Promise<string> {
  console.log('🔑 Getting admin auth token from saved state...');

  // Try to use saved auth state from integration tests first
  try {
    const fs = await import('fs/promises');
    const authFile = './playwright/.auth/integration-user.json';
    const authState = JSON.parse(await fs.readFile(authFile, 'utf-8'));

    const localStorage = authState.origins?.[0]?.localStorage;
    const authToken = localStorage?.find((item: any) => item.name === 'sb-app-auth-token');

    if (authToken) {
      const tokenData = JSON.parse(authToken.value);
      const expiresAt = tokenData.expires_at * 1000; // Convert to milliseconds

      if (expiresAt > Date.now()) {
        console.log('✅ Using saved auth token (valid until', new Date(expiresAt).toISOString(), ')');
        return tokenData.access_token;
      } else {
        console.log('⚠️  Saved token expired, need to re-authenticate');
      }
    }
  } catch (e) {
    console.log('⚠️  Could not load saved auth state:', (e as Error).message);
  }

  // Fall back to login flow
  console.log('🔑 Signing in with credentials...');
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://app.captainapp.co.uk';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const password = process.env.E2E_TEST_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('E2E_TEST_PASSWORD or ADMIN_PASSWORD environment variable required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`);
  }

  if (!data.session?.access_token) {
    throw new Error('No access token in response');
  }

  console.log('✅ Got admin token');
  return data.session.access_token;
}

async function createSession(token: string): Promise<Session> {
  console.log('📦 Creating session...');
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test Realtime Session',
      region: 'lhr',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create session: ${res.status} ${text}`);
  }

  const session = await res.json();
  console.log('✅ Created session:', session.sessionId);
  return session;
}

async function getSession(token: string, sessionId: string): Promise<Session> {
  console.log('🔍 Getting session details...');
  const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get session: ${res.status}`);
  }

  const session = await res.json();
  console.log('✅ Got session, hasRealtimeToken:', !!session.realtimeToken);
  return session;
}

async function sendTask(token: string, sessionId: string): Promise<{ runId: string }> {
  console.log('🚀 Sending task...');
  const res = await fetch(`${API_URL}/sessions/${sessionId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: 'Create a simple hello.txt file with the text "Hello World"',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send task: ${res.status} ${text}`);
  }

  const result = await res.json();
  console.log('✅ Task sent, runId:', result.runId);
  return result;
}

function connectWebSocket(sessionId: string, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to WebSocket...');
    const wsUrl = `wss://engine.shipbox.dev/realtime?sessionId=${sessionId}&token=${token}`;
    const ws = new WebSocket(wsUrl);

    let eventCount = 0;
    let connected = false;

    const timeout = setTimeout(() => {
      if (!connected) {
        console.error('❌ WebSocket connection timeout');
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }
    }, 10000);

    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      connected = true;
      clearTimeout(timeout);

      // Stay connected for 60 seconds to monitor events
      setTimeout(() => {
        console.log(`\n📊 Total events received: ${eventCount}`);
        ws.close();
        resolve();
      }, 60000);
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = data.toString();

        // Handle ping
        if (message === 'ping') {
          ws.send('pong');
          return;
        }

        const event = JSON.parse(message);
        eventCount++;
        console.log(`\n📨 Event #${eventCount}:`, {
          seq: event.seq,
          type: event.type,
          timestamp: new Date(event.timestamp).toISOString(),
          data: event.data,
        });
      } catch (e) {
        console.error('❌ Failed to parse message:', e, data.toString());
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', (code, reason) => {
      console.log(`⚠️  WebSocket closed: ${code} ${reason}`);
      if (!connected) {
        clearTimeout(timeout);
        reject(new Error(`WebSocket closed before connecting: ${code} ${reason}`));
      }
    });
  });
}

async function main() {
  try {
    // Step 1: Get admin token
    const token = await getAdminToken();

    // Step 2: Create session
    const session = await createSession(token);

    // Step 3: Get session details to get realtimeToken
    const sessionDetails = await getSession(token, session.sessionId);

    if (!sessionDetails.realtimeToken) {
      throw new Error('Session does not have realtimeToken!');
    }

    // Step 4: Connect WebSocket before sending task
    const wsPromise = connectWebSocket(session.sessionId, sessionDetails.realtimeToken);

    // Give WebSocket a moment to connect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Send task
    await sendTask(token, session.sessionId);

    // Step 6: Wait for events
    console.log('\n⏳ Waiting for events (60 seconds)...\n');
    await wsPromise;

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
