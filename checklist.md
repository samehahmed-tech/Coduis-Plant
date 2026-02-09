# RestoFlow Module Completion Checklist

## Global Launch Gates
- [ ] ETA credentials configured and validated (`npm run eta:check` = `ok: true`).
- [ ] ETA smoke submission returns `SUBMITTED` (`npm run eta:smoke`).
- [ ] Redis Socket adapter enabled in staging/prod.
- [ ] Branch protection enabled with required CI checks.
- [ ] Secrets rotated and removed from code/history.
- [ ] Production backup/restore drill completed.
- [x] Day close workflow with permission-based email reports.
- [x] Arabic translation review and fixes.

## 1) Dashboard
- [x] Move all KPI calculations to backend report services.
- [x] Standardize KPI definitions across dashboard/reports.
- [x] Add branch-scoped KPI permissions.
- [x] Acceptance: Dashboard values match report endpoints for same date range.

## 2) POS
- [x] Replace local coupon simulation with real coupon API and validation rules.
- [x] Add transactional backend endpoints for table transfer/split/merge.
- [x] Add manager approval policy for high-risk actions (void/discount/close table).
- [ ] Acceptance: No data mismatch between table state and active order state.

## 3) Call Center
- [x] Replace mock driver assignment with `/api/delivery` integration.
- [x] Load real drivers/zones by branch.
- [x] Emit realtime dispatch updates to all terminals.
- [x] Acceptance: Assigning driver updates order + driver status consistently.

## 4) KDS
- [x] Persist station settings in DB instead of localStorage.
- [x] Add station authorization and per-branch visibility.
- [x] Add KDS SLA timers with alert thresholds.
- [ ] Acceptance: Station config survives logout/device change.

## 5) Menu Manager
- [x] Add item lifecycle states (`draft`, `approved`, `published`).
- [x] Add approval flow for price/fiscal code changes.
- [x] Add import/export pipeline with validation.
- [ ] Acceptance: Every published change is audited and reversible.

## 6) Recipe Manager
- [ ] Add BOM validation (missing items, invalid units, negative costs).
- [x] Add recipe versioning and change history.
- [x] Auto-recalculate cost impact when ingredient costs change.
- [ ] Acceptance: Margin and cost numbers are deterministic and traceable.

## 7) Inventory
- [x] Implement Suppliers tab end-to-end (list/create/update/deactivate).
- [x] Implement Purchase Orders tab end-to-end (create/approve/receive/close).
- [x] Implement Branch logistics tab (inter-branch transfers and receipts).
- [x] Acceptance: Inventory movement is fully traceable with audit records.

## 8) Production
- [x] Build production order backend module (create/start/consume/complete/cancel).
- [x] Reserve raw materials at start and reconcile at complete.
- [x] Add yield variance and wastage capture.
- [x] Acceptance: Production order updates stock and finance postings correctly.

## 9) CRM
- [x] Add customer segmentation engine.
- [x] Add loyalty rules and tier automation.
- [ ] Add campaign trigger hooks and event history.
- [ ] Acceptance: Segment and loyalty outputs are reproducible and auditable.

## 10) HR (ZenPeople)
- [x] Replace mock employee data with backend employees module.
- [x] Add attendance APIs (clock-in/out with branch device context).
- [x] Add payroll cycles and payout ledger integration.
- [ ] Acceptance: Payroll reports reconcile with attendance and finance entries.

## 11) Finance
- [x] Replace local persisted ledger with backend double-entry engine.
- [x] Add posting rules from POS/inventory/purchase/production events.
- [x] Add reconciliation + period close workflow.
- [x] Acceptance: Trial balance and journal reports balance with no drift.

## 12) Reports
- [x] Move all tab calculations (sales/profit/food-cost/vat) to backend services.
- [x] Add report export (`CSV`, `PDF`) from server.
- [x] Add report integrity checks against source tables.
- [x] Acceptance: Report numbers equal direct SQL reference queries.

## 13) Fiscal Hub (ETA)
- [ ] Configure all required ETA env keys.
- [x] Add dead-letter queue for failed submissions.
- [x] Add retry strategy with capped backoff and observability.
- [ ] Acceptance: ETA success rate > 98% on staging validation batch.

## 14) AI Insights
- [ ] Move AI analysis orchestration to backend service.
- [ ] Add caching + prompt/version tracking + token cost controls.
- [ ] Add explainability metadata for each insight.
- [ ] Acceptance: Same inputs produce stable, explainable outputs.

## 15) AI Assistant
- [ ] Expand guarded action coverage for real admin workflows.
- [ ] Enforce permission checks server-side for all executed actions.
- [ ] Ensure full before/after audit snapshots for AI actions.
- [ ] Acceptance: No sensitive mutation executes without explicit confirmation.

## 16) Security Hub
- [x] Replace local `updateUsers` usage with backend user CRUD actions.
- [x] Add forced sign-out/session revocation on role/permission changes.
- [x] Add MFA roadmap hooks and policy flags.
- [ ] Acceptance: Role/permission change is effective system-wide in real time.

## 17) Printer Manager
- [x] Replace local printer state with backend printer module.
- [x] Add printer heartbeat/status checks.
- [ ] Add print routing tests and fallback behavior.
- [ ] Acceptance: Kitchen/bar/cashier routes print reliably per branch config.

## 18) Forensics Hub
- [x] Complete signature validation pipeline for all audit events.
- [x] Add tamper detection and escalation alerts.
- [x] Add forensic filters by actor/entity/branch/time.
- [ ] Acceptance: Any invalid signature is flagged and investigated automatically.

## 19) Franchise Manager
- [x] Build true multi-branch analytics APIs.
- [x] Add permission-based drill-down for branch managers vs super admin.
- [x] Add branch benchmarking and anomaly alerts.
- [x] Acceptance: Branch comparison uses server-verified metrics only.

## 20) Campaign Hub
- [x] Replace static campaign list with backend campaigns module.
- [x] Add channel execution tracking (SMS/Email/Push).
- [x] Add conversion attribution and ROI reporting.
- [x] Acceptance: Campaign performance is measurable and exportable.

## 21) Dispatch Hub
- [x] Replace simulated drivers with drivers API/store integration.
- [x] Add live route/delivery status updates.
- [x] Add delivery SLA and delay alerts.
- [x] Acceptance: Dispatch board reflects real operational state without refresh.

## 22) Settings Hub
- [x] Connect all quick actions (add branch/platform/warehouse) to real workflows.
- [ ] Add role-based restrictions for critical settings changes.
- [ ] Add settings change audit trail and rollback support.
- [ ] Acceptance: No settings section depends on UI-only actions.

## 23) Setup Wizard
- [x] Extend wizard to include printers, roles, tables, and menu bootstrap.
- [ ] Add setup validation summary before final submit.
- [ ] Add setup completion health checks.
- [ ] Acceptance: New branch can go live from wizard without manual DB edits.

## 24) Login/Auth
- [x] Add brute-force/rate-limit protections on login.
- [x] Add signed audit logging for login success/failure/rate-limit events.
- [x] Add optional MFA for admin and finance roles.
- [x] Add session/device management.
- [ ] Acceptance: Auth logs and controls meet production security baseline.

## Cross-System Technical Debt
- [ ] Remove debug `console.log` in production paths.
- [ ] Remove/contain legacy `services/erp/*` localStorage sync flow.
- [ ] Standardize offline strategy on Dexie queue + server conflict policy.
- [ ] Fix remaining Arabic encoding artifacts in legacy text blocks.
- [ ] Acceptance: No critical path depends on mock/local-only behavior.

## Suggested Delivery Order
- [x] Wave 1: Security Hub + Printer Manager + Inventory placeholders.
- [x] Wave 2: Dispatch + Campaign + Franchise analytics.
- [x] Wave 3: HR + Finance backend modules.
- [ ] Wave 4: ETA production + reporting finalization + UAT.
