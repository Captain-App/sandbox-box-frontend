# Why We Test (And What We Actually Do)

If you're skeptical about testing, that's fair. Most testing docs are written by testing zealots who've never shipped under pressure. This isn't that.

Here's the deal: Shipbox is a distributed system with money on the line. Users pay for compute time. Sandboxes spin up across the globe. Auth tokens fly between services. When something breaks at 3am, we want a machine to catch it before a customer does.

---

## The Pyramid: Not Religion, Just Economics

We run three kinds of tests. Each one exists because of a real production incident or a class of bug we kept shipping.

```
         ┌───────────────┐
         │    E2E        │  ← "Can a user actually do the thing?"
         │  (Playwright) │     Slow, expensive, high confidence
         └───────────────┘
        ┌─────────────────────┐
        │   Integration       │  ← "Do our services talk to each other correctly?"
        │ (Vitest + Workers)  │     Medium speed, catches config bugs
        └─────────────────────┘
    ┌─────────────────────────────────┐
    │          Unit Tests             │  ← "Does this function do math right?"
    │           (Vitest)              │     Fast, cheap, run constantly
    └─────────────────────────────────┘
```

### Unit Tests (The Fast Ones)
**What they catch:** Typos. Off-by-one errors. That time someone changed a date format and broke invoicing.

**Where they live:** `packages/shared`, React components, utility functions.

**How fast:** Milliseconds. You can run them on every keystroke if you want.

### Integration Tests (The Cloudflare Ones)
**What they catch:** "Works on my machine" bugs. Durable Object state issues. API routes returning 500s.

**Where they live:** `workers/api`, `sandbox-mcp`.

**The trick:** We use Cloudflare's `vitest-pool-workers` to run tests in an actual Workers runtime, not a fake Node.js environment. This catches bugs that only appear in production.

### E2E Tests (The Expensive Ones)
**What they catch:** "The button is there but nothing happens." Auth flows. The full user journey.

**Where they live:** `e2e/` folder.

**The setup:** Playwright logs in once, saves the auth state, and reuses it. Tests run in real Chrome.

---

## What Happens When You Open a PR

GitHub Actions runs five parallel jobs. All must pass before merge:

| Job | What It Does | Why It Matters |
|-----|--------------|----------------|
| **test-api** | Runs API worker tests | Catches broken endpoints |
| **test-engine** | Runs sandbox-mcp tests | Catches orchestration bugs |
| **test-frontend** | Runs React component tests | Catches UI regressions |
| **test-e2e** | Full browser tests | Catches integration failures |
| **test-docs** | Builds documentation site | Catches broken doc links |

If any fail, you'll see a red X. Click it to see what broke.

---

## Static Analysis (The Stuff That Runs Before Tests)

These catch bugs without even running your code:

- **TypeScript**: Catches type mismatches. You passed a string where we expected a number.
- **ESLint / Oxlint**: Catches code smells. Unused variables. Missing await.
- **Knip**: Catches dead code. That file nobody imports anymore.

The `sandbox-mcp` engine has stricter checks. Run `npm run check` in that folder to run everything.

---

## Running Tests Locally

From the project root:

```bash
# Run unit tests once
npm test

# Run unit tests in watch mode (re-runs on file change)
npm run test:watch

# Run E2E tests with visual browser
npm run test:e2e:ui

# Run everything
npm run test:all
```

For the engine specifically:

```bash
cd sandbox-mcp
npm run check  # typecheck + format + lint + knip + test
```

---

## The Point

We're not testing for the sake of testing. We're testing because:

1. **Sandboxes cost money.** A billing bug means angry customers or lost revenue.
2. **Distributed systems fail in weird ways.** The only way to catch "Durable Object evicted mid-request" bugs is to simulate them.
3. **CI is cheaper than on-call.** A 5-minute test suite catches bugs before they page someone at 3am.

If a test doesn't prevent a real bug, delete it. If a real bug keeps happening, write a test for it.
