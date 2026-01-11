# Roadmap: Shipbox

This document outlines the strategic plan for productising **shipbox.dev** as a multi-tenant platform wrapping the `shipbox-engine` (forked from `sandbox-mcp`).

## Vision
To provide a secure, scalable, and multi-tenant interface for managed AI sandbox environments, leveraging Cloudflare's serverless infrastructure.

## Architecture

| Component | Name | Description |
| :--- | :--- | :--- |
| **Frontend** | `shipbox-dev` | React dashboard at shipbox.dev |
| **Auth Wrapper** | `shipbox-api` | Hono + Effect worker handling auth and ownership |
| **Engine** | `shipbox-engine` | Forked sandbox-mcp handling sandbox lifecycle |

## Development Phases

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **0: Foundation** | Infrastructure setup, forking upstream, auth wrapper skeleton. | ✅ Done |
| **1: Local Development** | Refinement, local testing, mock implementations, frontend integration. | 🏗️ In Progress |
| **2: Integration** | Cloudflare deployment, D1/R2 provisioning, e2e integration. | 📅 Planned |
| **3: Production** | Billing, rate limiting, monitoring, security hardening. | 📅 Planned |

---

## Progress Tracker

### Phase 0: Foundation (Completed)
- [x] Fork `sandbox-mcp` to `Captain-App` organization.
- [x] Integrate `sandbox-mcp` as a Git submodule.
- [x] Create `shipbox-api` auth wrapper using Hono and Effect.
- [x] Implement internal CRUD API in engine fork.
- [x] Configure Cloudflare Service Bindings for engine communication.
- [x] Set up GitHub Actions CI/CD skeleton.
- [x] Rebrand project to `shipbox-dev` with domain `shipbox.dev`.

### Phase 1: Local Development (Current)
- [ ] Implement robust `SessionService` unit tests.
- [ ] Finalise mock D1 and Service Binding for isolated testing.
- [ ] Align frontend components with real API data structures.
- [ ] Document local developer onboarding.

### Phase 2: Integration
- [ ] Provision production D1 (`shipbox-db`) and R2 (`shipbox-sessions`).
- [ ] Configure environment secrets (Supabase, Anthropic, GitHub).
- [ ] Implement end-to-end integration tests (Vitest + Playwright).
- [ ] Deploy staging environment to `staging.shipbox.dev`.

### Phase 3: Production
- [ ] Integrate usage-based billing logic.
- [ ] Implement request rate limiting and quota management.
- [ ] Set up error tracking (Sentry) and observability (Honeycomb/Logflare).
- [ ] Conduct security audit and access control hardening.
- [ ] Launch at `shipbox.dev`.
