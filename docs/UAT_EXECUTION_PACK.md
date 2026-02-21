# UAT Execution Pack (Role-Based)

Date: 2026-02-12
Owner: QA Lead + Ops Lead

## 1. Scope
This UAT pack covers go-live roles:
- Cashier
- Chef/Kitchen
- Supervisor (Call Center + Dispatch)
- Finance
- Branch Manager

## 2. Pre-UAT Preconditions
- Environment: staging mirror of production config.
- `npm run go-live:preflight` => no `FAIL`.
- `npm run smoke:core` => pass.
- If fiscal in scope: `npm run eta:check` and `npm run eta:smoke` pass.
- Test users prepared for every role.
- Test data prepared: menu, categories, tables, printers, customers, drivers.

## 3. Role Scenarios

### 3.1 Cashier (POS)
1. Open shift, create takeaway order, confirm send to kitchen, collect payment, print receipt.
2. Create dine-in order on table, add/remove items, send kitchen delta, split bill, close table.
3. Apply discount requiring manager approval, then complete payment.

Acceptance:
- No blocking errors.
- Correct order lifecycle and status transitions.
- Correct receipt/print routing by item printer mapping.

### 3.2 Chef/Kitchen (KDS)
1. Observe new pending orders arriving in real time.
2. Start preparation -> mark ready -> complete.
3. Verify notes/modifiers/order details and station assignment.

Acceptance:
- Tickets include order number, item details, notes/modifiers.
- SLA coloring and alerts are accurate.
- Station routing follows deterministic mapping.

### 3.3 Supervisor (Call Center + Dispatch)
1. Create call center order, assign driver, monitor status progression.
2. Trigger escalation for old pending order and resolve escalation.
3. Add coaching note for agent and approve/reject discount abuse item.

Acceptance:
- Escalations queue/action works end-to-end.
- Driver telemetry visible in dispatch hub.
- Supervisor actions persisted and auditable.

### 3.4 Finance
1. Validate POS payment postings and reconciliation entries.
2. Run day-close and verify summarized totals.
3. Fiscal submission status check (if in scope).

Acceptance:
- Totals match raw order/payment data.
- No missing journal/reconciliation entries.
- Fiscal failures visible and actionable.

### 3.5 Branch Manager
1. Validate permissions boundaries by role.
2. Validate settings change control and audit trail.
3. Validate top KPI dashboards against raw sample orders.

Acceptance:
- Unauthorized actions are blocked.
- Audit records captured.
- KPI values are consistent.

## 4. Evidence to Capture
- Screenshots/videos per scenario.
- API logs for critical flows.
- Print/fiscal evidence where applicable.
- Defect log with severity (Critical/High/Medium/Low).

## 5. Exit Criteria
UAT is PASS only when:
- 0 Critical defects.
- 0 High defects in launch-critical flow.
- All role scenarios passed or waived with signed risk.

## 6. Sign-off Table
| Role | Owner | Status | Notes | Date |
|---|---|---|---|---|
| Cashier |  |  |  |  |
| Kitchen |  |  |  |  |
| Supervisor |  |  |  |  |
| Finance |  |  |  |  |
| Branch Manager |  |  |  |  |
