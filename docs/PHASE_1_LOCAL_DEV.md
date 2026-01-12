# Phase 1: Local Development

## Overview

Phase 1 focuses on making the development environment robust, testable, and aligned with the final production architecture.

## Current Objectives

### 1. Robust Service Layer

- **SessionService**: Finalise the ownership registry implementation using Effect-TS.
- **Typed Errors**: Use `Schema.TaggedError` for specific failure cases (OwnershipError, StorageError).

### 2. Isolated Testing

- **Mock D1**: Use an in-memory D1 implementation for fast unit tests.
- **Mock Service Bindings**: Create a test utility to mock the `SANDBOX_MCP` fetcher, allowing us to test `shipbox-api` in isolation from the actual engine.

### 3. Frontend Integration

- **API Mapping**: Ensure the React frontend correctly handles the metadata returned by `shipbox-engine` (e.g., `title`, `sessionId`, `status`).
- **Web UI Proxying**: Test the flow from the frontend through the auth wrapper's proxy to the OpenCode interface.

---

## Testing Strategy

### Unit Testing (Vitest + Effect)

- **Service Layer**: 100% coverage for `SessionService` logic.
- **Middleware**: Test `supabaseAuth` with mock tokens.
- **Models**: Validate that `CreateSessionInput` and `UserSession` schemas correctly decode incoming data.

### Component Testing (React)

- **SandboxSelector**: Verify it correctly displays "Active" vs "Inactive" boxes based on the new status field.
- **CreateSandboxModal**: Ensure it correctly passes the optional repository URL to the API.

### Integration Testing (Local)

- **Local Proxy Flow**: Using `wrangler dev`, verify that requests to `localhost:8787/session/:id` are correctly intercepted, ownership-checked, and proxied.
