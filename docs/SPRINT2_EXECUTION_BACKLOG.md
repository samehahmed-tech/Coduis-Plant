# Sprint 2 Execution Backlog (Weeks 3-4)

Source plan: `docs/ERP_EGYPT_EXECUTION_MASTER_PLAN.md`  
Sprint goal: Egyptian compliance and operational integration readiness.

---

## 1) Sprint Scope

Phase B deliverables:
- ETA production readiness,
- day-close communication readiness,
- payment integration adapter readiness.

Success target:
- hard go-live gates enforce scope requirements,
- ETA/SMTP validation paths executable on staging,
- integration contracts documented and testable.

---

## 2) Task Board

## P0 - Critical

### S2-GATE-001: Enforce go-live integration gates in preflight

Type: Platform/DevOps  
Owner: DevOps + Backend  
Status: `completed`

Implementation:
- Add explicit env-driven launch gates in preflight:
  - `GO_LIVE_REQUIRE_STRICT_CORS`
  - `GO_LIVE_REQUIRE_ETA`
  - `GO_LIVE_REQUIRE_SMTP`
  - `GO_LIVE_REQUIRE_S3`
- Ensure preflight summary includes active gate state.

Target files:
- `scripts/go-live-preflight.ts`
- `.env.production.example`
- `docs/GO_LIVE_READINESS.md`

Acceptance:
- Preflight fails required checks when launch-scoped integration env is missing.
- Teams can selectively enforce gates per rollout scope.

---

### S2-ETA-001: ETA validation runbook + dead-letter visibility

Type: Compliance  
Owner: Backend + Ops  
Status: `pending`

Implementation:
- Ensure `npm run eta:check` and `npm run eta:smoke` are part of staged validation.
- Expose failure counters and retry backlog in manager-facing view.

Target files:
- `scripts/eta-config-check.ts`
- `scripts/eta-e2e-smoke.ts`
- fiscal/manager UI module(s)

---

### S2-SMTP-001: Day-close email operational verification

Type: Compliance/Operations  
Owner: Backend + Frontend  
Status: `pending`

Implementation:
- Validate SMTP send path for day-close reports on staging.
- Surface delivery failures in manager UI with retry action.

Target files:
- day-close controllers/services
- day-close UI page(s)

---

## P1 - High

### S2-PAY-001: Payment adapter contract (provider-agnostic)

Type: Architecture  
Owner: Backend lead  
Status: `pending`

Implementation:
- Define provider-neutral adapter interface for:
  - Vodafone Cash
  - InstaPay
  - card processors
- Add stub provider and contract test.

Target files:
- `server/services/` payment adapter module(s)
- `tests/` contract tests

---

## 3) Status Tracker

- [x] S2-GATE-001
- [ ] S2-ETA-001
- [ ] S2-SMTP-001
- [ ] S2-PAY-001
