#!/usr/bin/env npx tsx

/**
 * Get a Supabase access token for MCP authentication.
 *
 * Usage:
 *   npx tsx scripts/get-supabase-token.ts
 *
 * Or with environment variables:
 *   E2E_TEST_EMAIL=your@email.com E2E_TEST_PASSWORD=password npx tsx scripts/get-supabase-token.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://app.captainapp.co.uk";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("Shipbox Supabase Token Generator");
  console.log("=".repeat(60));
  console.log("");

  // Get credentials from env or prompt
  let email = process.env.E2E_TEST_EMAIL;
  let password = process.env.E2E_TEST_PASSWORD;

  if (!email) {
    email = await prompt("Email: ");
  }
  if (!password) {
    password = await prompt("Password: ");
  }

  if (!email || !password) {
    console.error("Error: Email and password are required");
    process.exit(1);
  }

  console.log("");
  console.log("Authenticating...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Authentication failed:", error.message);
    process.exit(1);
  }

  if (!data.session) {
    console.error("No session returned");
    process.exit(1);
  }

  const accessToken = data.session.access_token;
  const expiresAt = new Date(data.session.expires_at! * 1000);

  console.log("");
  console.log("=".repeat(60));
  console.log("SUCCESS! Access token:");
  console.log("=".repeat(60));
  console.log("");
  console.log(accessToken);
  console.log("");
  console.log("=".repeat(60));
  console.log(`Expires at: ${expiresAt.toLocaleString()}`);
  console.log("");
  console.log("To use with Claude Code MCP, run:");
  console.log("");
  console.log(`export SUPABASE_ACCESS_TOKEN="${accessToken}"`);
  console.log("");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
