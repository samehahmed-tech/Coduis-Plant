# Go-Live Action Plan

Generated: 2026-02-15T00:22:33.252Z

## Flags

- requireEta: `false`
- requireRedisRealtime: `false`
- socketRedisEnabled: `false`

## Current Blockers (from tooling)

- [PASS] `launch-gates`: ok=true failedRequired=0
- [FAIL] `uat-signoff`: roles=5 pending_or_fail=5
- [FAIL] `rollback-drill`: hasTimings=true approvals(ops,product)=(false,false)

## Actions

### MEDIUM: Decide ETA launch scope

Why: ETA gates are optional unless GO_LIVE_REQUIRE_ETA=true.

How:
- If ETA is in scope for Egypt go-live: set `GO_LIVE_REQUIRE_ETA=true` and configure `ETA_*`.
- If not in scope for this launch: keep `GO_LIVE_REQUIRE_ETA=false` and ensure fiscal UI is disabled/hidden per branch policy.

Evidence:
- `scripts/go-live-preflight.ts`
- `.env.production.example`

### LOW: Decide realtime scaling scope

Why: Redis adapter is required only when running multiple backend instances or when explicitly enabled.

How:
- If production will run multiple instances: set `SOCKET_REDIS_ENABLED=true` + `SOCKET_REDIS_URL` and pass `ops:realtime-gate`.
- If single instance only: keep it disabled, but document the scaling constraint.

Evidence:
- `docs/GO_LIVE_READINESS.md`
- `.env.production.example`

### BLOCKER: Complete UAT per role (sign-off gate)

Why: Pending/failing roles: Cashier, Kitchen, Supervisor, Finance, BranchManager

How:
- For each role: set `owner`, execute test cases, attach evidence fields, set `status=PASS`.
- Re-run: `npm run ops:uat-signoff-check` until PASS.

Evidence:
- `artifacts/uat/role-signoff.json`
- `scripts/uat-signoff-check.ts`

### BLOCKER: Execute and record rollback drill (measurable + approved)

Why: timings=ok approvals=missing checklistIncomplete=5

How:
- Run the drill steps from `docs/ROLLBACK_DRILL_PLAYBOOK.md`.
- Fill `artifacts/rollback/drill-report.json`: timing fields + mark checklist items `completed=true` + set `approvals.ops/product=true`.
- Re-run: `npm run ops:rollback-drill-check`.

Evidence:
- `docs/ROLLBACK_DRILL_PLAYBOOK.md`
- `scripts/rollback-drill-check.ts`

### HIGH: Run pilot branch for 7-14 days with daily evidence

Why: This is the last real-world confidence gate before market go-live.

How:
- Run daily: `npm run ops:go-live:daily` and keep `artifacts/evidence/go-live-daily.json` history.
- Log operational incidents and fixes in `artifacts/pilot/<date>/daily-log.md`.
- At end: close remaining blockers then generate final manifest with `npm run ops:collect-evidence`.

Evidence:
- `docs/PILOT_BRANCH_RUNBOOK.md`
- `docs/PILOT_DAILY_LOG_TEMPLATE.md`
