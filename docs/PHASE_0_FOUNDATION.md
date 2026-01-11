# Phase 0: Foundation

## Overview
Phase 0 focused on establishing the core architecture of the Shipbox platform. The primary goal was to create a clean separation between the **engine** (`shipbox-engine`) and the **auth wrapper** (`shipbox-api`).

## Key Accomplishments

### 1. Submodule Strategy
- **Upstream Fork**: Forked `ghostwriternr/sandbox-mcp` to `Captain-App/sandbox-mcp`.
- **Submodule Integration**: Added the fork as a submodule to `shipbox-dev`.
- **Upstream Tracking**: Configured the fork to track the original repository as `upstream` for easy updates.

### 2. Engine Modification
- **Internal API**: Added `/internal/sessions` endpoints to `sandbox-mcp/src/index.ts`.
- **Purpose**: Allows the auth wrapper to perform administrative tasks (create, list, delete) without exposing these capabilities directly to the public internet.

### 3. Auth Wrapper (`workers/api`)
- **Service Bindings**: Configured `SANDBOX_MCP` binding to communicate with the engine worker directly via Cloudflare's internal network.
- **Ownership Registry**: Created a D1 schema focused purely on user-to-session mappings (`user_sessions` table).
- **Authorization Layer**: Implemented a thin Hono middleware to verify ownership before proxying requests to the engine.

### 4. CI/CD
- **GitHub Actions**: Created `.github/workflows/deploy.yml` to automate the deployment of both the engine and the wrapper.

### 5. Rebranding
- **Project Name**: Renamed from `cloud-box-castle` to `shipbox-dev`.
- **Workers**: `shipbox-api` (auth wrapper) and `shipbox-engine` (sandbox engine).
- **Domain**: Registered and configured `shipbox.dev`.

## Testing Strategy (Phase 0)
- **Manual Verification**: Verified that the submodule points to the correct fork and commit.
- **Git Flow**: Tested the update loop (committing in submodule, then in main repo).
- **Static Analysis**: Ensured `wrangler.jsonc` configurations are valid for both workers.
