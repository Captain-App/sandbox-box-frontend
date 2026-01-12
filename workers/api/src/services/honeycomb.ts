import { Context, Effect, Layer } from "effect";
import { SessionStorageError } from "@shipbox/shared";

export interface HoneycombSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  durationMs: number;
  timestamp: string;
  serviceName: string;
  statusCode?: string;
  attributes: Record<string, any>;
}

export interface HoneycombTrace {
  traceId: string;
  rootSpan?: HoneycombSpan;
  spans: HoneycombSpan[];
}

export interface HoneycombServiceInterface {
  readonly listRecentTraces: (limit: number) => Effect.Effect<HoneycombSpan[], SessionStorageError>;
  readonly getTraceDetails: (traceId: string) => Effect.Effect<HoneycombTrace, SessionStorageError>;
  readonly getSessionTraces: (sessionId: string) => Effect.Effect<HoneycombSpan[], SessionStorageError>;
}

export class HoneycombService extends Context.Tag("HoneycombService")<
  HoneycombService,
  HoneycombServiceInterface
>() {}

function makeHoneycombService(apiKey: string, dataset: string): HoneycombServiceInterface {
  const fetchHoneycombResults = async (query: any) => {
    // 1. Create query result
    const response = await fetch(
      `https://api.honeycomb.io/1/query_results/${dataset}`,
      {
        method: "POST",
        headers: {
          "X-Honeycomb-Team": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Honeycomb API error: ${response.status} ${errorText}`);
    }

    let result = await response.json() as any;
    const resultId = result.id;

    // 2. Poll for results (simple polling for max 10 seconds)
    let attempts = 0;
    while (result.status !== "complete" && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollRes = await fetch(
        `https://api.honeycomb.io/1/query_results/${dataset}/${resultId}`,
        {
          headers: { "X-Honeycomb-Team": apiKey }
        }
      );
      if (!pollRes.ok) throw new Error("Failed to poll Honeycomb results");
      result = await pollRes.json();
      attempts++;
    }

    if (result.status !== "complete") {
      throw new Error("Honeycomb query timed out");
    }

    return result.data;
  };

  const mapSpan = (row: any): HoneycombSpan => {
    // Honeycomb return format depends on columns selected
    // Usually row.data is an object with column names as keys
    const d = row.data || row;
    return {
      id: d["span_id"] || d["trace.span_id"],
      traceId: d["trace_id"] || d["trace.trace_id"],
      parentId: d["parent_id"] || d["trace.parent_id"],
      name: d["name"],
      durationMs: d["duration_ms"],
      timestamp: d["timestamp"],
      serviceName: d["service_name"] || d["service.name"],
      statusCode: d["status_code"] || d["response.status_code"],
      attributes: d,
    };
  };

  return {
    listRecentTraces: (limit) =>
      Effect.tryPromise({
        try: async () => {
          const query = {
            calculations: [{ op: "COUNT" }],
            breakdowns: ["trace.trace_id", "name", "service.name", "duration_ms", "timestamp"],
            filters: [
              { column: "trace.parent_id", op: "does-not-exist" }
            ],
            limit,
            orders: [{ column: "timestamp", order: "descending" }]
          };
          
          const data = await fetchHoneycombResults(query);
          return (data.results || []).map(mapSpan);
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getTraceDetails: (traceId) =>
      Effect.tryPromise({
        try: async () => {
          const query = {
            calculations: [{ op: "COUNT" }],
            breakdowns: ["trace.span_id", "trace.parent_id", "name", "service.name", "duration_ms", "timestamp", "status_code"],
            filters: [
              { column: "trace.trace_id", op: "=", value: traceId }
            ],
            orders: [{ column: "timestamp", order: "ascending" }]
          };
          
          const data = await fetchHoneycombResults(query);
          const spans = (data.results || []).map(mapSpan);
          const rootSpan = spans.find(s => !s.parentId);
          
          return { traceId, rootSpan, spans };
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getSessionTraces: (sessionId) =>
      Effect.tryPromise({
        try: async () => {
          const query = {
            calculations: [{ op: "COUNT" }],
            breakdowns: ["trace.trace_id", "name", "service.name", "duration_ms", "timestamp"],
            filters: [
              { column: "trace.parent_id", op: "does-not-exist" },
              { column: "sessionId", op: "=", value: sessionId }
            ],
            orders: [{ column: "timestamp", order: "descending" }]
          };
          
          const data = await fetchHoneycombResults(query);
          return (data.results || []).map(mapSpan);
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),
  };
}

export function makeHoneycombServiceLayer(apiKey: string, dataset: string): Layer.Layer<HoneycombService> {
  return Layer.succeed(HoneycombService, makeHoneycombService(apiKey, dataset));
}
