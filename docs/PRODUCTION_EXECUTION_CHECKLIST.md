# RestoFlow ERP Production Execution Checklist

## Phase 0 - Launch Gate (Mandatory)

### 0.1 Secrets & Config
- [ ] Remove any real keys from local `.env` and repository history.
- [x] Add `.env.production.example` without secrets.
- [x] Configure `CORS_ORIGINS` for dev/staging/prod.
- [x] Add go-live gate flags (`GO_LIVE_REQUIRE_*`) to production template.
- [ ] Rotate current AI/ETA keys.
- [ ] Acceptance: no secret leaks, and `npm run eta:check` output is safe.

### 0.2 Type/Test/Build Gate
- [ ] Add CI workflow with:
  - [x] `npx tsc --noEmit`
  - [x] `npm test`
  - [x] `npm run build`
- [ ] Enforce required checks before merge.
- [ ] Acceptance: every PR passes all three checks.

### 0.3 DB Migration Discipline
- [ ] Use `db:generate` + `db:migrate` for production.
- [ ] Keep backfill scripts documented (`db:fix:zones`).
- [ ] Acceptance: zero schema drift between local and staging.

## Phase 1 - Fiscal & Compliance (ETA)

### 1.1 ETA Credentials
- [ ] Fill all required `ETA_*` in staging.
- [ ] Run `npm run eta:check`.
- [ ] Acceptance: `ok: true` with no missing keys.

### 1.2 ETA End-to-End
- [ ] Run `npm run eta:smoke`.
- [ ] Verify `fiscal_logs` show `SUBMITTED`.
- [ ] Add dead-letter/retry policy for failed submissions.
- [ ] Acceptance: submission success rate > 98% in repeated tests.

### 1.3 Fiscal Monitoring
- [ ] Add fiscal status dashboard (pending/submitted/failed).
- [ ] Add alerting on repeated ETA failures.
- [ ] Acceptance: failures are visible within 1 minute.

## Phase 2 - Realtime & Scale

### 2.1 Redis Socket Adapter
- [ ] Enable `SOCKET_REDIS_ENABLED=true` in staging.
- [ ] Set `SOCKET_REDIS_URL`.
- [ ] Validate `/api/ops/realtime-health`.
- [ ] Acceptance: `adapter=redis` and `redisConnected=true`.

### 2.2 Load Testing
- [ ] Run `npm run load:realtime:node` with 500 clients.
- [ ] Run with 1000 clients.
- [ ] Optionally run k6 script for broader profile.
- [ ] Acceptance: failure rate < 1% and stable reconnect behavior.

### 2.3 Performance Tuning
- [ ] Profile slow queries and API hotspots.
- [ ] Add missing indexes for `orders`, `order_items`, `fiscal_logs`, `tables`.
- [ ] Acceptance: p95 latency for critical APIs < 300ms.

## Phase 3 - Online/Offline Reliability

### 3.1 Sync Integrity
- [ ] Enforce idempotency for all order/payment sync writes.
- [ ] Document and enforce conflict policy (server authority + version check).
- [ ] Acceptance: no duplicates and no loss after reconnect.

### 3.2 Offline Test Cases
- [ ] Test order creation during internet outage.
- [ ] Test reconnect and sync retry behavior.
- [ ] Test concurrent updates on same order.
- [ ] Acceptance: 100% data consistency after sync.

## Phase 4 - UX & Operational Flow

### 4.1 POS/TableMap Workflow
- [ ] Review top 10 daily workflows (open/close table, send kitchen, payment).
- [ ] Reduce clicks and time-to-complete.
- [ ] Acceptance: measurable improvement over current flow.

### 4.2 Setup Wizard
- [ ] Ensure complete onboarding path:
  - [ ] Branch
  - [ ] Tax
  - [ ] Printers
  - [ ] Roles
  - [ ] Tables
  - [ ] Menu
- [ ] Add validation and safe defaults.
- [ ] Acceptance: new branch can go live in < 20 minutes.

### 4.3 Design Consistency
- [ ] Unify design tokens and visual states.
- [ ] Validate RTL/LTR behavior and accessibility.
- [ ] Acceptance: no visual inconsistencies in core screens.

## Phase 5 - Business Completeness

### 5.1 Module Completion
- [ ] Complete inventory lifecycle (purchase -> stock -> usage -> wastage).
- [ ] Complete finance reconciliation with POS/orders/payments.
- [ ] Complete CRM segmentation and campaign hooks.
- [ ] Acceptance: no critical module depends on mock logic.

### 5.2 Reporting
- [ ] Add daily/weekly/monthly exportable reports.
- [ ] Validate report outputs against raw DB queries.
- [ ] Acceptance: report numbers are financially trusted.

## Phase 6 - Production Operations

### 6.1 Observability
- [ ] Add structured logging with request IDs.
- [ ] Add metrics and alerts for API/DB/socket/ETA.
- [ ] Acceptance: degradation is detected and actionable.

### 6.2 Backup & Recovery
- [ ] Configure automated PostgreSQL backups.
- [ ] Run restore drills.
- [ ] Acceptance: tested and documented RPO/RTO.

### 6.3 Release Governance
- [ ] Enforce release flow: staging -> UAT -> production.
- [ ] Document rollback steps for each deployment.
- [ ] Acceptance: rollback can be completed within minutes.

## Weekly Delivery Checklist
- [ ] Week 1: Phase 0
- [ ] Week 2: Phase 1
- [ ] Week 3: Phase 2
- [ ] Week 4: Phase 3
- [ ] Week 5: Phase 4
- [ ] Week 6: Phase 5 + Phase 6 + go-live readiness

## Daily Standup Checklist
- [ ] What was completed yesterday?
- [ ] What is planned for today?
- [ ] Current blockers?
- [ ] Is `tsc/test/build` green?
- [ ] Any ETA or realtime risk today?

## Current Status Snapshot (2026-02-06)
- [x] CI workflow now runs `tsc + test + build` on push/PR.
- [x] Secret scan job added in CI using gitleaks.
- [x] Production env template added: `.env.production.example`.
- [x] Security baseline document added: `docs/SECURITY_PRODUCTION_BASELINE.md`.
- [ ] ETA production credentials are still missing in runtime env.
- [ ] Required branch protection rule must be enabled in GitHub settings.
