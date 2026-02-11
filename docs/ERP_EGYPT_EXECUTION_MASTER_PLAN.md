# RestoFlow ERP Egypt Master Execution Plan

Version: 1.0  
Date baseline: February 11, 2026  
Scope: Production-grade Restaurant ERP for Egyptian market operations

---

## 1) Objective

Deliver a production-ready, market-fit Restaurant ERP for Egypt with:
- fiscal compliance readiness (ETA),
- high-throughput operations (POS/KDS/Call Center/Dispatch),
- financial integrity,
- security and auditability,
- reliable online/offline behavior,
- role-driven usability for real branches.

Target readiness: move from ~75-80% to >95% go-live confidence.

---

## 2) Execution Model

### 2.1 Workstreams

1. Product & Operations
2. Backend & Domain Integrity
3. Frontend UX & Workflow Speed
4. Compliance & Integrations (ETA/SMTP/Payments)
5. Platform Reliability (DB/Realtime/Observability)
6. Security & Governance
7. QA/UAT & Release Management

### 2.2 Cadence

- Sprint length: 2 weeks
- Daily standup: 15 min
- Weekly checkpoint: architecture + delivery risk review
- End of sprint: demo + hard acceptance gate

### 2.3 Definition of Done (global)

Each completed item must include:
- code merged,
- test coverage added/updated where relevant,
- role-based permission checks,
- audit/log behavior verified,
- UAT scenario passed,
- docs/runbook updated.

---

## 3) Release Roadmap (12 Weeks)

## Phase A (Weeks 1-2): Production Hardening Foundation

### Goals
- eliminate critical architecture gaps before feature expansion.

### Deliverables

1. AI backend governance (critical)
- Move AI orchestration to backend services.
- Enforce server-side permission checks for all AI actions.
- Store prompt/version metadata and action explainability.
- Log before/after snapshots for each AI execution.

2. Order consistency hardening
- Formalize idempotency keys for order create/update flows.
- Add conflict policy for status updates and retries.
- Implement reconciliation report for queued/offline operations.

3. Error contract normalization
- Introduce standard error codes and safe user-facing messages.
- Remove raw internal error leakage in API responses where needed.

### Acceptance gates
- No sensitive AI action executes from frontend-only logic.
- Duplicate order creation under retries = 0 in stress tests.
- API errors are code-based and localized in UI critical flows.

---

## Phase B (Weeks 3-4): Egyptian Compliance & Operational Integrations

### Goals
- ensure readiness for Egyptian fiscal and day-close operations.

### Deliverables

1. ETA production readiness
- Complete required `ETA_*` environment provisioning.
- Validate `npm run eta:check` and `npm run eta:smoke`.
- Add ETA failure alerting and retry/dead-letter monitoring.

2. Day Close communication readiness
- Complete `SMTP_*` setup.
- Validate report email delivery for branch close.
- Add failure visibility in manager UI.

3. Payment integration readiness plan
- Define integration adapter layer for Egyptian methods:
  - Vodafone Cash
  - InstaPay
  - card processors (based on provider contract)
- Keep POS abstractions provider-agnostic.

### Acceptance gates
- ETA submission success >= 98% in validation batch.
- Day close emails succeed in UAT for all active branches.
- Payment adapter interface approved and test stub validated.

---

## Phase C (Weeks 5-6): High-Throughput UX for Core Operations

### Goals
- reduce steps and operator friction during peak hours.

### Deliverables

1. POS peak-hour mode
- One-hand tablet-first controls.
- Quick macro buttons for frequent actions.
- Shortened checkout path with fewer modal interruptions.

2. Call Center operations cockpit
- Expand manager dashboard (already introduced) with:
  - drill-down filters,
  - CSV exports,
  - SLA alert ribbons,
  - agent productivity leaderboard.

3. KDS workflow acceleration
- One-tap status progression per station.
- Station workload balancing cues.
- Critical SLA escalation alerts.

### Acceptance gates
- Order placement median interaction steps reduced by >= 25%.
- Call center dispatch assignment time reduced by >= 30%.
- KDS overdue order handling time reduced by >= 20%.

---

## Phase D (Weeks 7-8): Data Integrity, Finance Trust, and Reporting

### Goals
- make outputs audit-grade and financially trusted.

### Deliverables

1. Finance integrity controls
- Cross-check postings from POS/inventory/production.
- Add reconciliation exception dashboard.
- Enforce period-close blockers on unresolved mismatches.

2. Reporting trust framework
- Automated parity checks versus SQL source aggregates.
- Report versioning with query signature metadata.
- Scheduled exports and branch-level subscriptions.

3. Audit/forensics improvement
- Alert pipelines for tamper anomalies.
- Forensics views with branch/entity/user drill-down.

### Acceptance gates
- Trial balance remains balanced under real workflow test packs.
- Report parity errors = 0 for defined acceptance datasets.
- Forensic signature verification > 99.9% pass for generated events.

---

## Phase E (Weeks 9-10): Scale, Performance, and Reliability

### Goals
- maintain stable performance under realistic multi-branch load.

### Deliverables

1. DB and API performance tuning
- profile and index hotspots (`orders`, `order_items`, `fiscal_logs`, `tables`).
- enforce pagination and response size caps where needed.

2. Realtime scaling
- validate Redis adapter behavior in multi-instance deployments.
- test reconnect robustness and event fanout consistency.

3. Observability stack baseline
- request correlation IDs,
- latency/error dashboards,
- alert rules for API/DB/socket/ETA queue.

### Acceptance gates
- p95 critical endpoint latency < 300ms.
- realtime failure rate < 1% under planned load profile.
- alerting actionable with documented ownership and SLA.

---

## Phase F (Weeks 11-12): UAT, Go-Live, and Controlled Rollout

### Goals
- move from technical readiness to business-safe launch.

### Deliverables

1. Role-based UAT completion
- Cashier, Kitchen, Call Center Agent, Call Center Manager, Branch Manager, Finance, Super Admin.

2. Go-live runbook finalization
- staging -> pilot branch -> phased rollout.
- rollback protocol and data recovery drills.

3. Hypercare plan
- 14-day incident protocol post-launch.
- daily KPI + risk review.

### Acceptance gates
- all role UAT scripts signed off.
- rollback rehearsal completed successfully.
- pilot branch runs 7 consecutive days without critical severity incidents.

---

## 4) Detailed Feature Improvement Backlog by Dimension

## 4.1 Features

1. Call Center Manager advanced module
- agent shift utilization,
- delivery backlog heatmap,
- discount abuse pattern detection,
- callback queue management.

2. Dispatch enhancements
- live GPS integration for drivers,
- route ETA tracking and deviation alerts.

3. Compliance module
- fiscal retry console with bulk retry and incident annotations.

4. Franchise analytics
- benchmark cohorts by branch type/location/daypart.

## 4.2 Ease of Use

1. Unified interaction language
- consistent action labels and confirmation patterns across modules.

2. Smart defaults
- branch, order type, station, and payment defaults by role.

3. Reduced click paths
- streamline frequent call-center and POS operations.

4. Tablet-first responsiveness
- optimize controls for 768x1024 and 800x1280 target profiles.

## 4.3 System Organization

1. API contract standardization
- snake_case/camelCase mapping policy and enforcement.

2. Domain boundaries
- clarify ownership between `orders`, `dispatch`, `payments`, `fiscal`.

3. Config governance
- role-restricted settings with rollback and audit references.

## 4.4 Performance

1. Cache strategy
- short-lived caching for dashboard/franchise KPI endpoints.

2. Batch endpoints
- reduce N+1 fetch patterns for high-volume manager dashboards.

3. Queue health
- explicit monitoring for offline sync queue and replay lag.

## 4.5 Integration and Responsiveness

1. Integration gates
- enforce hard launch gates for ETA/SMTP/CORS at preflight level.

2. External provider resilience
- retries with bounded backoff and circuit-breaker behavior.

3. User feedback latency
- immediate UX feedback with reliable server acknowledgement states.

---

## 5) KPI Framework (Go-Live and Post-Go-Live)

### Operational KPIs
- average order lifecycle time,
- pending orders > SLA threshold,
- cancellation rate,
- dispatch assignment lead time.

### Financial KPIs
- posting reconciliation mismatch count,
- day close completion on-time rate,
- report parity drift.

### Technical KPIs
- API p95 and p99 latency,
- server error rate,
- realtime disconnect/reconnect ratio,
- offline sync backlog size and replay success rate.

### Compliance KPIs
- ETA submission success rate,
- dead-letter queue aging,
- fiscal retry resolution time.

---

## 6) Governance and Ownership Matrix

Assign named owners before execution starts:
- Product owner: process priority + acceptance criteria.
- Tech lead: architecture, code quality, release gates.
- Backend lead: data integrity, integrations, performance.
- Frontend lead: UX speed, tablet optimization, consistency.
- QA lead: UAT pack, regression gate, release sign-off.
- Ops/DevOps owner: environments, observability, backup/restore.

---

## 7) Risk Register and Mitigation

1. ETA instability risk
- Mitigation: preflight + smoke + dead-letter monitoring + escalation playbook.

2. Peak-hour performance degradation
- Mitigation: load tests, profiling, query/index optimization, circuit controls.

3. Data divergence in offline/online transitions
- Mitigation: idempotency, conflict policies, replay audits, integrity dashboards.

4. Permission drift and unauthorized actions
- Mitigation: server-side checks + audit signatures + role change propagation.

---

## 8) Immediate Next 10 Working Days Plan

1. Day 1-2
- finalize owner assignments and sprint board.
- convert this document into actionable tickets.

2. Day 3-5
- AI backend governance implementation kickoff.
- order consistency hardening kickoff.

3. Day 6-7
- ETA/SMTP environment completion on staging.
- preflight gate hardening.

4. Day 8-10
- Call Center Manager enhancements (exports + SLA alerts).
- UAT script draft for core operational roles.

---

## 9) Ticket Template (Use For Every Task)

Title: `[Workstream] [Module] [Action]`  
Business value:  
Technical scope:  
Dependencies:  
Acceptance criteria:  
Test plan:  
Rollout notes:  
Rollback notes:  
Owner:  
Target sprint:

---

## 10) Exit Criteria (Ready for Egyptian Market Launch)

System is considered launch-ready only when:
- all Phase A-F acceptance gates pass,
- no open critical/high severity blockers,
- ETA and day-close workflows are operational under real branch conditions,
- role-based UAT sign-off is complete,
- rollback and recovery drills are validated.

---

## 11) Execution Backlog Link

Immediate implementation board for Sprint 1:
- `docs/SPRINT1_EXECUTION_BACKLOG.md`
