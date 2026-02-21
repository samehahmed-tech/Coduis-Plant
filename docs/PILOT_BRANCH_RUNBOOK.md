# Pilot Branch Runbook (7-14 Days)

Date: 2026-02-12
Owner: Ops + Branch Manager

## 1) Objective
Run controlled live operations on one branch for 7-14 consecutive days with strict monitoring and rollback readiness.

## 2) Preconditions
- `npm run ops:launch-gates` passes on target environment.
- UAT role pack executed with no critical blockers.
- Branch data complete (menu/tables/printers/users/drivers).
- On-call matrix published (Ops, Backend, POS support).

## 3) Daily Pilot Routine
1. Start of day checks:
   - Platform health (`ops:platform-health`)
   - Realtime health (`ops:realtime-gate`)
   - Fiscal readiness dashboard clean (or accepted risk list)
2. Live operation window:
   - POS -> KDS flow sampling every 2 hours
   - Delivery SLA check every 60 minutes
   - Escalations queue check and closure SLA
3. End of day checks:
   - Day close report
   - Fiscal submission summary
   - Incidents/defects log update

## 4) Mandatory KPIs During Pilot
- Order processing success rate
- Average ticket preparation time
- Delivery SLA breach rate
- API/platform error rates
- Fiscal success rate

## 5) Stop/Abort Criteria
Stop pilot immediately if one of the following occurs:
- Repeated critical payment/order loss issue
- Fiscal submission sustained failure beyond accepted threshold
- Realtime outage that blocks branch operations

## 6) Evidence Artifacts
Store under `artifacts/pilot/<date>/`:
- `launch-gates.json`
- day-close exports
- incident log
- KPI snapshot
- Quick init command:
  - `npm run ops:pilot:init`
  - Optional env:
    - `PILOT_DATE=YYYY-MM-DD`
    - `PILOT_BRANCH_ID=<branch-id>`

## 7) Exit Criteria (Pilot PASS)
- 7+ consecutive days with no unresolved critical incidents
- KPI thresholds respected or approved with mitigation
- Sign-off by Ops + Product + Branch Manager
