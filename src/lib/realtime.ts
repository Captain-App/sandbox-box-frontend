// src/lib/realtime.ts
import { useState, useEffect, useRef, useCallback } from "react";

export interface RealtimeEvent {
  seq: number;
  type: string;
  timestamp: number;
  sessionId: string;
  data: any;
}

export function useRealtime(sessionId: string | null, token: string | null) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSeq, setLastSeq] = useState(-1);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!sessionId || !token) {
      console.log("[Realtime] Missing sessionId or token", { sessionId: !!sessionId, token: !!token });
      return;
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("[Realtime] WebSocket already open");
      return;
    }

    // Use engine URL for WebSockets
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = "engine.shipbox.dev"; // Hardcoded for now as per plan
    const url = `${protocol}//${host}/realtime?sessionId=${sessionId}&token=${token}${
      lastSeq >= 0 ? `&lastSeq=${lastSeq}` : ""
    }`;

    console.log("[Realtime] Connecting to WebSocket", { url: url.replace(token, "***"), sessionId });
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[Realtime] ✅ WebSocket connected successfully", { sessionId });
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        console.log("[Realtime] 📨 Received event", { type: data.type, seq: data.seq, data: data.data });
        if (data.type === "ping") {
          ws.send("pong");
          return;
        }
        setEvents((prev) => {
          // Avoid duplicates on replay
          if (prev.some((e) => e.seq === data.seq)) return prev;
          const next = [...prev, data].sort((a, b) => a.seq - b.seq);
          console.log("[Realtime] Updated events, total count:", next.length);
          return next;
        });
        setLastSeq(data.seq);
      } catch (e) {
        console.error("[Realtime] ❌ Failed to parse WebSocket message:", e, event.data);
      }
    };

    ws.onclose = (event) => {
      console.log("[Realtime] ⚠️  WebSocket disconnected", { code: event.code, reason: event.reason, wasClean: event.wasClean });
      setIsConnected(false);
      socketRef.current = null;

      // Attempt reconnect after 3 seconds
      if (!reconnectTimeoutRef.current) {
        console.log("[Realtime] Scheduling reconnect in 3s");
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("[Realtime] ❌ WebSocket error:", error);
      ws.close();
    };
  }, [sessionId, lastSeq, token]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastSeq(-1);
  }, []);

  return { events, isConnected, clearEvents };
}
