# Sprint 1 Execution Backlog (Weeks 1-2)

Source plan: `docs/ERP_EGYPT_EXECUTION_MASTER_PLAN.md`  
Sprint goal: close the highest-risk production gaps before broader rollout.

---

## 1) Sprint Scope

This sprint executes Phase A:
- AI backend governance,
- order consistency hardening,
- API error contract normalization.

Success target:
- all P0/P1 tasks completed,
- acceptance tests green,
- no open critical blockers.

---

## 2) Task Board

## P0 - Critical

### S1-AI-001: Add Backend AI orchestration endpoint set

Type: Backend/API  
Owner: Backend lead  
Status: `completed`

Implementation:
- Extend `/api/ai` beyond current `insights/execute` with:
  - `POST /api/ai/chat`
  - `POST /api/ai/action-preview`
  - `POST /api/ai/action-execute`
- Keep all permission checks server-side.
- Enforce whitelist of executable action types.

Target files:
- `server/routes/aiRoutes.ts`
- `server/controllers/aiController.ts`
- `server/services/aiService.ts`
- `services/api.ts` (frontend wrapper)

Acceptance:
- Frontend no longer directly executes privileged mutations from model output.
- Unauthorized roles receive `403` with stable error code.

Tests:
- Add `tests/aiBackendGuard.test.ts` for denied/allowed actions.

---

### S1-AI-002: Move AI Assistant execution path to backend

Type: Frontend + Backend integration  
Owner: Frontend lead  
Status: `completed`

Implementation:
- Replace direct mutation execution path in `components/AIAssistant.tsx` with:
  - preview from backend,
  - explicit approval,
  - execute via backend endpoint.
- Keep UX “Approve & Run” but execution source becomes API only.

Target files:
- `components/AIAssistant.tsx`
- `services/api.ts`
- `components/AIInsights.tsx` (if applicable)

Acceptance:
- No direct store mutation from raw model action without backend approval result.
- Audit entries generated for preview and execute operations.

Tests:
- Update/add `tests/aiActionGuard.test.ts` path assertions for backend-driven flow.

---

### S1-ORD-001: Add idempotency key support for order creation

Type: Backend/API  
Owner: Backend lead  
Status: `completed`

Implementation:
- Support `Idempotency-Key` header (or body field fallback) in `createOrder`.
- Persist mapping (request key -> order id/result hash) with expiry.
- Return original order if same key is retried.

Target files:
- `server/controllers/orderController.ts`
- `src/db/schema.ts` (new table `idempotency_keys` if needed)
- migration artifacts (`drizzle/*`)

Acceptance:
- Retried same request does not create duplicate orders.
- Distinct payload with same key returns conflict error.

Tests:
- Add `tests/orderIdempotency.test.ts`.

---

### S1-ORD-002: Harden order status update concurrency

Type: Backend/API  
Owner: Backend lead  
Status: `completed`

Implementation:
- Enforce optimistic concurrency with `expected_updated_at`.
- Return conflict code when stale client tries status mutation.
- Add branch/role safety checks for high-risk transitions.

Target files:
- `server/controllers/orderController.ts`
- `services/api.ts` typing updates
- `stores/useOrderStore.ts` conflict handling UX path

Acceptance:
- Concurrent stale status updates do not overwrite latest state silently.
- UI gets deterministic conflict message and refresh action.

Tests:
- Add `tests/orderStatusConflict.test.ts`.

---

### S1-ERR-001: Standardize API error shape

Type: Backend platform  
Owner: Backend lead  
Status: `completed`

Implementation:
- Replace ad-hoc `{ error: error.message }` in critical controllers with standard format:
  - `code`
  - `message`
  - `details?`
  - `requestId`
- Map known domain failures to stable codes.

Target files:
- `server/middleware/errorHandler.ts`
- critical controllers:
  - `server/controllers/orderController.ts`
  - `server/controllers/authController.ts`
  - `server/controllers/reportController.ts`
  - `server/controllers/setupController.ts`

Acceptance:
- Frontend can branch behavior on `code` reliably.
- Internal stack/error leakage minimized in production mode.

Tests:
- Add `tests/apiErrorContract.test.ts`.

---

## P1 - High

### S1-OBS-001: Correlation ID and request logging baseline

Type: Backend platform  
Owner: DevOps/backend  
Status: `completed`

Implementation:
- Generate/request-pass `X-Request-Id`.
- Include request id in errors and structured logs.

Target files:
- `server/app.ts`
- `server/middleware/errorHandler.ts`

Acceptance:
- Every failed API response contains request id.
- Logs can trace request lifecycle.

---

### S1-FE-001: Frontend conflict/error UX normalization

Type: Frontend UX  
Owner: Frontend lead  
Status: `completed`

Implementation:
- In `services/api.ts`, normalize server errors to typed app errors.
- In POS/Call Center flows, show actionable messages for:
  - conflict,
  - permission denied,
  - validation errors.

Target files:
- `services/api.ts`
- `components/POS.tsx`
- `components/CallCenter.tsx`
- `stores/useOrderStore.ts`

Acceptance:
- Operators see clear, short, actionable messages with retry guidance.

---

### S1-QA-001: Regression pack for core flows

Type: QA/Test  
Owner: QA lead  
Status: `completed`

Implementation:
- Create a scripted smoke pack:
  - create order,
  - update status,
  - assign driver,
  - close shift/day-close preview.

Target files:
- `scripts/` new smoke scripts
- optional docs update in `docs/GO_LIVE_READINESS.md`

Acceptance:
- Smoke pack passes in staging on demand.

---

## 3) Out of Scope (Sprint 1)

- GPS live driver map integration.
- Payment gateway provider integration.
- Advanced franchise benchmarking model.
- Full observability dashboards with external tooling.

---

## 4) Daily Execution Checklist

1. Pull latest + run `npx tsc --noEmit`.
2. Run focused tests for touched modules.
3. Keep PR size bounded (one task id per PR where possible).
4. Update task status in this file.
5. End-of-day: note blockers and risk changes.

---

## 5) Sprint Acceptance Gate

Sprint is accepted only if:
- all P0 tasks are `completed`,
- P1 tasks at least 2/3 completed,
- `npx tsc --noEmit` passes,
- `npm test` passes,
- no critical regression in POS/KDS/Call Center flow.

---

## 6) Status Tracker

- [x] S1-AI-001
- [x] S1-AI-002
- [x] S1-ORD-001
- [x] S1-ORD-002
- [x] S1-ERR-001
- [x] S1-OBS-001
- [x] S1-FE-001
- [x] S1-QA-001
