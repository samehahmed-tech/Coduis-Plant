# Rollback Drill Playbook

Date: 2026-02-12
Owner: Ops Lead

## 1. Objective
Validate that deployment rollback can be completed safely within minutes with no data loss outside agreed RPO.

## 2. Target SLO
- Detection to rollback start: <= 5 minutes
- Rollback completion: <= 15 minutes
- Service recovery verification: <= 10 minutes

## 3. Preconditions
- Latest stable release tag exists.
- Database backup snapshot confirmed and restorable.
- On-call engineer + release owner available.
- Change window announced.

## 4. Drill Steps
1. Deploy candidate release to staging.
2. Simulate failure condition (e.g., API 5xx spike, failed critical flow).
3. Declare rollback decision in incident channel with timestamp.
4. Re-deploy previous stable release artifact.
5. If schema changed, execute backward-compatible rollback plan:
   - Use feature flag off-switch first.
   - Revert app version.
   - Apply DB rollback only if explicitly safe and approved.
6. Validate recovery:
   - `npm run ops:platform-health`
   - critical endpoint checks (`/api/health`, `/api/orders`, `/api/menu/full`)
   - realtime health (`/api/ops/realtime-health`)
7. Execute smoke flow: POS -> KDS -> payment.
8. Capture timeline and lessons learned.

## 5. Evidence Template
- Incident start time:
- Decision time:
- Rollback start time:
- Rollback end time:
- Recovery verification time:
- Data integrity checks passed: Yes/No
- Customer impact window:
- Action items:
- JSON template: `docs/ROLLBACK_DRILL_TEMPLATE.json`
- Validation command: `npm run ops:rollback-drill-check`
  - Input path via `ROLLBACK_DRILL_PATH` (default: `artifacts/rollback/drill-report.json`)

## 6. Data Integrity Checks
- Order count before/after rollback for drill branch.
- Payment totals before/after rollback.
- No duplicate orders created during rollback window.

## 7. Go/No-Go Rule
Mark rollback capability as validated only if:
- full drill executed end-to-end,
- recovery checks passed,
- post-drill report approved by Ops + Product.
