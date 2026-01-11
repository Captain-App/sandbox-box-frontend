# Phase 2: Integration

## Overview
Phase 2 is about moving from local "mocks" to real Cloudflare infrastructure and verifying the end-to-end flow.

## Objectives

### 1. Cloudflare Provisioning
- **D1 Database**: Create `shipbox-db` and run `schema.sql`.
- **R2 Bucket**: Create `shipbox-sessions` bucket.
- **Worker Deploys**: Deploy both `shipbox-engine` and `shipbox-api` to the same account.

### 2. Environment Hardening
- **Secrets Management**: Configure `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, and `SUPABASE_ANON_KEY` via `wrangler secret put`.
- **Cross-Worker Comms**: Verify the Service Binding correctly resolves in the production environment.

### 3. DNS Configuration
- **Domain**: Configure `shipbox.dev` DNS in Cloudflare.
- **Subdomains**: 
  - `api.shipbox.dev` → `shipbox-api` worker
  - `app.shipbox.dev` → Frontend (Cloudflare Pages or Worker)
  - `staging.shipbox.dev` → Staging environment

### 4. End-to-End Testing
- **Integration Suite**: Run tests that call the real deployed API endpoints.
- **Persistence Checks**: Verify that sandboxes created by one user are NOT visible or accessible to another user.

---

## Testing Strategy

### Staging Environment
- Deploy to a `staging` environment that mirrors production 1:1.
- Use a dedicated staging Supabase project for auth.

### Integration Tests (Vitest)
- Test the full CRUD cycle against the live staging API.
- Validate that sandbox state survives worker restarts.

### Browser Testing (Playwright)
- Automate login through Supabase.
- Automate sandbox creation and opening the OpenCode Web UI.
- Verify the `SESSION_COOKIE` is correctly set and passed through the proxy.
