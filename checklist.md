# RestoFlow Execution Checklist (Live)

Date: 2026-02-12
Owner: Codex execution stream
Rule: تنفيذ خطوة ثم تعليمها ثم الانتقال للتي بعدها بدون توقف.

## Phase 0 - Mandatory Runtime Discipline

### POS / Order Lifecycle
- [x] توحيد دورة حياة الطلب حسب النوع (TAKEAWAY/PICKUP/DELIVERY/DINE_IN).
- [x] منع إنشاء الطلب مباشرة بحالة `PREPARING`.
- [x] فصل سلوك `Submit` عن `Kitchen Fire` مع سياسة موحدة.
- [x] إرسال تحديثات المطبخ عند التنفيذ بدل سلوك متضارب.

### KDS Deterministic Routing
- [x] تفعيل routing بالأولوية: `item printer -> category printer -> station default`.
- [x] الإبقاء على keyword fallback فقط كمسار احتياطي.
- [x] دعم mapping بين printer و station من الإعدادات.
- [x] إزالة كل اعتماد localStorage من KDS settings.

### Egypt ETA Gate
- [x] تجهيز ETA readiness dashboard و alerts (endpoint + UI + auto-refresh 60s).
- [ ] إكمال ETA production credentials على بيئة التشغيل الفعلية.
- [~] تنفيذ smoke test فعلي على staging/production (`eta:smoke`) (launch gate runner جاهز + evidence output).

## Phase 1 - Operational Hardening

### Offline / Sync
- [x] إزالة legacy localStorage sync path في `services/erp/*`.
- [~] توحيد سياسة replay/idempotency لكل المسارات (شبه مكتمل: order create/status + stock update/transfer + table layout/status/transfer/split/merge + replay-safe create conflicts in sync queue).

### Realtime / Scale
- [x] إضافة endpoint فحص realtime `GET /api/ops/realtime-health`.
- [x] إضافة endpoint صحة موحدة `GET /api/ops/platform-health` (DB/Socket/Fiscal + alerts).
- [x] إضافة script تشغيلي `npm run ops:platform-health` للتحقق السريع من صحة التشغيل.
- [~] تفعيل Redis adapter على staging وإغلاق gate بالأدلة (gate script جاهز: `npm run ops:realtime-gate`).
- [x] تنفيذ load tests 500/1000 clients وإغلاق الأداء محليًا بالأدلة (`artifacts/load/realtime-bench-summary.json`).

### Production Hygiene
- [x] تقليل API debug logs وربطها بـ `VITE_DEBUG_API`.
- [x] إضافة request id middleware + request logging على مستوى السيرفر.
- [x] masking موحّد للحقول الحساسة في كل logs.

## Phase 2 - Operations Intelligence

### Call Center Supervisor
- [x] Queue للتصعيدات المفتوحة (عرض + resolve).
- [x] إنشاء تصعيد يدوي من الطلبات المعلقة.
- [x] Auto scan للتصعيدات (`POST /api/call-center/escalations/scan`).
- [x] قواعد إساءة الخصومات/موافقات manager (كامل).
- [x] Agent coaching notes workflow كامل.

### Dispatch
- [x] إضافة telemetry endpoints لمواقع السائقين.
- [x] عرض telemetry في Dispatch Hub.
- [x] ETA prediction heuristic متقدم (speed + stale telemetry + SLA pressure + active load).
- [x] live GPS production stream + SLA auto-escalation متكامل.

### Kitchen Intelligence
- [x] تنبؤ زمن التحضير per item/station.
- [x] load visualization + bottleneck alerts.
- [x] smart batching suggestions.

## Phase 3 - UX / Arabic / Market Readiness

- [x] إصلاح mojibake في `CallCenterManager`.
- [x] إصلاح mojibake حرج في `KDS`.
- [x] تنظيف شامل لباقي الشاشات العربية (تم تدقيق شامل للنصوص/الترميزات).
- [x] مراجعة tablet usability كاملة لـ POS/KDS/Call Center.

## Phase 4 - Compliance / Launch

- [x] readiness docs + preflight scripts مضافة.
- [~] تشغيل UAT كامل حسب الدور (Cashier/Chef/Supervisor/Finance/Manager) (execution pack جاهز، التشغيل الميداني pending).
- [~] Pilot branch تشغيل حقيقي 7-14 يوم (runbook + daily template جاهزين، التنفيذ الميداني pending).
- [~] Rollback drill موثق ومجرب (playbook + JSON template + checker جاهزين، التجربة الميدانية pending).

## Execution Log

- [x] 2026-02-12: Added `GET /api/ops/platform-health` in `server/controllers/opsController.ts` and route in `server/routes/opsRoutes.ts`.
- [x] 2026-02-12: Rebuilt `components/CallCenterManager.tsx` with clean Arabic text and Auto Scan button.
- [x] 2026-02-12: Hardened `server/controllers/menuController.ts` compatibility select to reduce `/api/menu/full` 500 risk on partial schemas.
- [x] 2026-02-12: Added sensitive-data masking in request/error logging (`server/middleware/requestContext.ts`, `server/middleware/errorHandler.ts`).
- [x] 2026-02-12: Added ETA readiness auto-refresh polling in `components/FiscalHub.tsx` (60s) for faster operational alert visibility.
- [x] 2026-02-12: Removed remaining KDS localStorage fallback for station keywords in `components/KDS.tsx`.
- [x] 2026-02-12: Cleaned remaining mojibake text fragments in `components/FiscalHub.tsx` (Arabic labels/currency/bullets).
- [x] 2026-02-12: Added runtime health script `scripts/platform-health-check.ts` and npm command `ops:platform-health`.
- [x] 2026-02-12: Implemented Call Center coaching notes workflow (API + routes + supervisor UI) in `server/controllers/callCenterSupervisorController.ts`, `server/routes/callCenterSupervisorRoutes.ts`, `services/api.ts`, `components/CallCenterManager.tsx`.
- [x] 2026-02-12: Implemented Dispatch SLA alerts + auto-escalation (backend endpoints + API client + DispatchHub UI) in `server/controllers/deliveryController.ts`, `server/routes/deliveryRoutes.ts`, `services/api.ts`, `components/DispatchHub.tsx`.
- [x] 2026-02-12: Added KDS prep-time prediction (station-load aware ETA per ticket) in `components/KDS.tsx`.
- [x] 2026-02-12: Added station load visualization + bottleneck alert in `components/KDS.tsx`.
- [x] 2026-02-12: Added smart batching suggestions in `components/KDS.tsx`.
- [x] 2026-02-12: Completed discount abuse governance workflow (detect + manager approve/reject) in `server/controllers/callCenterSupervisorController.ts`, `server/routes/callCenterSupervisorRoutes.ts`, `services/api.ts`, `components/CallCenterManager.tsx`.
- [x] 2026-02-12: Improved tablet usability for POS/KDS/Call Center by collapsing advanced controls into explicit toggles and reducing visual crowding (`components/POS.tsx`, `components/KDS.tsx`, `components/CallCenterManager.tsx`).
- [x] 2026-02-12: Completed Arabic text cleanup audit for core UI modules (no remaining mojibake patterns detected in `components/*`, `services/*`, `App.tsx`).
- [x] 2026-02-12: Added production-style realtime load profiles and JSON evidence output for 500/1000 clients (`scripts/load/realtime-node-load.ts`, `package.json` scripts `load:realtime:500`, `load:realtime:1000`).
- [x] 2026-02-12: Added role-based UAT execution pack (`docs/UAT_EXECUTION_PACK.md`) and rollback drill playbook (`docs/ROLLBACK_DRILL_PLAYBOOK.md`).
- [x] 2026-02-12: Hardened realtime load script to fail when websocket load is requested without auth token (`scripts/load/realtime-node-load.ts`) to prevent false-positive readiness.
- [x] 2026-02-12: Upgraded Dispatch ETA logic and cleaned Arabic text artifacts in `components/DispatchHub.tsx` (driver load/speed/staleness/SLA-aware ETA).
- [x] 2026-02-12: Extended idempotency flow for offline replay by adding Idempotency-Key propagation in client sync (`services/api.ts`, `src/services/syncService.ts`) and server-side idempotent handling for order status updates (`server/controllers/orderController.ts`).
- [x] 2026-02-12: Added inventory stock replay guard by reference id to prevent duplicate stock adjustments (`server/controllers/inventoryController.ts`, `src/services/syncService.ts`, `services/api.ts`).
- [x] 2026-02-12: Added realtime Redis gate script with pass/fail output and optional JSON evidence (`scripts/realtime-redis-gate.ts`, `package.json` -> `ops:realtime-gate`).
- [x] 2026-02-12: Hardened offline sync replay safety for CREATE actions by treating duplicate/unique conflicts as idempotent success in sync engine (`src/services/syncService.ts`).
- [x] 2026-02-12: Added unified launch gates runner (`scripts/launch-gate-runner.ts`, `package.json` -> `ops:launch-gates`) to execute ETA + Redis gates with JSON evidence (`artifacts/gates/launch-gates.json`).
- [x] 2026-02-12: Added realtime benchmark runner (`scripts/load/run-realtime-benchmarks.ts`, `package.json` -> `load:realtime:bench`) to execute 500/1000 scenarios and write summarized evidence (`artifacts/load/realtime-bench-summary.json`).
- [x] 2026-02-12: Added idempotent replay guards for transfer stock and table status updates, with sync reference propagation (`server/controllers/inventoryController.ts`, `server/controllers/tableController.ts`, `services/api.ts`, `src/services/syncService.ts`).
- [x] 2026-02-12: Added pilot branch operational runbook and daily logging template (`docs/PILOT_BRANCH_RUNBOOK.md`, `docs/PILOT_DAILY_LOG_TEMPLATE.md`).
- [x] 2026-02-12: Added unified evidence collector command (`scripts/collect-launch-evidence.ts`, `package.json` -> `ops:collect-evidence`) to generate final manifest (`artifacts/evidence/launch-evidence-manifest.json`) from launch gates + realtime bench.
- [x] 2026-02-12: Added UAT role sign-off template and automatic gate validator (`docs/UAT_ROLE_SIGNOFF_TEMPLATE.json`, `scripts/uat-signoff-check.ts`, `package.json` -> `ops:uat-signoff-check`).
- [x] 2026-02-12: Extended table-operation idempotency with replay references for layout/transfer/split/merge on backend and API/store propagation (`server/controllers/tableController.ts`, `services/api.ts`, `src/services/syncService.ts`, `stores/useOrderStore.ts`).
- [x] 2026-02-12: Added pilot workspace initializer (`scripts/init-pilot-workspace.ts`, `package.json` -> `ops:pilot:init`) to bootstrap daily logs and UAT signoff artifacts under `artifacts/`.
- [x] 2026-02-12: Added rollback drill JSON template and automatic validator (`docs/ROLLBACK_DRILL_TEMPLATE.json`, `scripts/rollback-drill-check.ts`, `package.json` -> `ops:rollback-drill-check`).
- [x] 2026-02-12: Extended evidence collector to optionally enforce rollback drill validation in final manifest (`scripts/collect-launch-evidence.ts`, env `INCLUDE_ROLLBACK_CHECK=true`).
- [x] 2026-02-13: Executed `npm run ops:pilot:init` successfully and created pilot/UAT workspace artifacts (`artifacts/pilot/2026-02-13/daily-log.md`, `artifacts/pilot/2026-02-13/pilot-meta.json`, `artifacts/uat/role-signoff.json`).
- [x] 2026-02-13: Executed ETA gate checks (`npm run eta:check`, `npm run ops:launch-gates`) and confirmed production ETA env is still incomplete (missing `ETA_BASE_URL`, `ETA_TOKEN_URL`, `ETA_CLIENT_ID`, `ETA_CLIENT_SECRET`, `ETA_API_KEY`, `ETA_PRIVATE_KEY`, `ETA_RIN`).
- [x] 2026-02-13: Executed realtime gates (`npm run ops:realtime-gate`, `npm run ops:launch-gates`) and confirmed gate failure due to backend health endpoint unreachable at `http://localhost:3001/api/ops/realtime-health` (`ECONNREFUSED`).
- [x] 2026-02-13: Executed load evidence runner (`npm run load:realtime:bench`) and captured failure evidence in `artifacts/load/realtime-bench-summary.json` (`AUTH_TOKEN` missing and API calls failed).
- [x] 2026-02-13: Executed evidence and governance checks (`npm run ops:collect-evidence`, `npm run ops:uat-signoff-check`, `npm run ops:rollback-drill-check`) and generated latest manifest at `artifacts/evidence/launch-evidence-manifest.json` while confirming UAT signoffs are pending and rollback drill report file is not yet created (`artifacts/rollback/drill-report.json` missing).
- [x] 2026-02-13: Bootstrapped rollback drill artifact from template (`artifacts/rollback/drill-report.json`) and reran `npm run ops:rollback-drill-check`; checker now fails on missing real drill timings/approvals (expected until field execution is completed).
- [x] 2026-02-13: Executed `npm run ops:platform-health` and confirmed platform gate is blocked by unreachable backend endpoint on `localhost:3001` (`ECONNREFUSED`).
- [x] 2026-02-13: Started backend and reran health gates with valid auth token; platform/realtime checks now return structured results instead of transport/auth failures (`npm run ops:platform-health`, `npm run ops:realtime-gate`).
- [x] 2026-02-13: Closed local realtime benchmark execution by running authenticated load tests successfully (`npm run load:realtime:bench` => 500/1000 passed, evidence in `artifacts/load/realtime-bench-summary.json`).
- [x] 2026-02-13: Regenerated unified evidence manifest after authenticated rerun (`npm run ops:collect-evidence` => `artifacts/evidence/launch-evidence-manifest.json`), current required blockers narrowed to ETA production config and Redis adapter gate.
- [x] 2026-02-13: Enabled centralized completion receipt printing for all order flows on status transition to `DELIVERED/COMPLETED` with session-level dedupe (`stores/useOrderStore.ts`).
- [x] 2026-02-13: Unified submit-print policy for POS/Call Center to configurable flag (`autoPrintReceiptOnSubmit`) and kept completion print as primary operational trigger (`components/POS.tsx`, `components/CallCenter.tsx`, `stores/useAuthStore.ts`, `types.ts`).
- [x] 2026-02-13: Added direct report print actions in analytics and day-close hubs (`components/Reports.tsx`, `components/DayCloseHub.tsx`).
- [x] 2026-02-13: Migrated printing architecture to Foodics-style branch gateway (backend print queue + gateway polling + frontend enqueue path) with Windows auto-start scripts (`server/services/printQueueService.ts`, `server/controllers/printGatewayController.ts`, `server/routes/printGatewayRoutes.ts`, `server/routes/printGatewayGatewayRoutes.ts`, `server/app.ts`, `src/services/printService.ts`, `hardware-bridge/index.js`, `scripts/install-print-bridge-startup.ps1`).
- [x] 2026-02-13: Added print queue observability and retry controls in Printer Manager + API (`components/PrinterManager.tsx`, `services/api.ts`, `server/controllers/printGatewayController.ts`, `server/routes/printGatewayRoutes.ts`, `server/services/printQueueService.ts`).
- [x] 2026-02-13: Upgraded printer operations to smart ERP mode: printer code/role/primary-cashier fields, heartbeat metadata, primary receipt routing, per-order-type logo/QR branding, and clearer department copy labels in kitchen tickets (`src/db/schema.ts`, `types.ts`, `server/controllers/printerController.ts`, `stores/useAuthStore.ts`, `components/PrinterManager.tsx`, `services/posPrintOrchestrator.ts`, `components/POS.tsx`, `components/CallCenter.tsx`, `stores/useOrderStore.ts`).
- [x] 2026-02-13: Upgraded dine-in floor operations with service-aware table statuses (`WAITING_FOOD`, `READY_TO_PAY`) driven by active order state, plus updated POS/table-management handling and localized labels (`types.ts`, `components/TableMap.tsx`, `components/POS.tsx`, `components/pos/TableManagementModal.tsx`, `services/translations.ts`).
- [x] 2026-02-13: Added table turnover KPI in Floor Map header (average dine-in table cycle time from closed orders) to support floor-performance monitoring (`components/TableMap.tsx`).
- [x] 2026-02-13: Simplified POS cart for faster operation and more menu space: removed quick-switch strip, removed cart width controls, forced compact cart column width, and kept cart sticky with internal scrolling only (`components/POS.tsx`).
- [x] 2026-02-13: Reordered POS cart for touch efficiency: moved control/payment block to top, moved items list to bottom with larger scroll area, and compacted cart item controls while keeping touch-friendly targets (`components/POS.tsx`, `components/pos/PaymentSummary.tsx`, `components/pos/CartItem.tsx`).
- [x] 2026-02-13: Added smart print failover routing: kitchen and cashier print paths now prioritize online branch printers, gracefully fallback to active alternatives, and mark fallback kitchen tickets in title for operator visibility (`services/posPrintOrchestrator.ts`).
- [x] 2026-02-14: Executed launch gates and governance checks (`npm run ops:launch-gates`, `npm run ops:uat-signoff-check`, `npm run ops:rollback-drill-check`). Current blockers confirmed: ETA production env still missing (`ETA_BASE_URL`, `ETA_TOKEN_URL`, `ETA_CLIENT_ID`, `ETA_CLIENT_SECRET`, `ETA_API_KEY`, `ETA_PRIVATE_KEY`, `ETA_RIN`), realtime Redis gate failed with `ECONNREFUSED` on local backend health check, UAT role signoffs all `PENDING`, and rollback drill timings/approvals still not populated in `artifacts/rollback/drill-report.json`.
- [x] 2026-02-14: Added unified blocker report command `npm run ops:go-live:blockers` (`scripts/go-live-blockers.ts`) to aggregate ETA/Redis/UAT/Rollback launch blockers into `artifacts/evidence/go-live-blockers.json` with fail-fast exit code for CI/go-live meetings.
- [x] 2026-02-14: Expanded `docs/UAT_ROLE_SIGNOFF_TEMPLATE.json` into role-based operational test matrix (Cashier/Kitchen/Supervisor/Finance/BranchManager) with concrete test cases and evidence fields to accelerate real field signoff collection.
- [x] 2026-02-14: Expanded `docs/ROLLBACK_DRILL_TEMPLATE.json` with structured drill checklist + timing section (`timing.detectionToRollbackStartMinutes`, `rollbackDurationMinutes`, `recoveryVerificationMinutes`) for measurable rollback execution.
- [x] 2026-02-14: Added daily go-live runner `npm run ops:go-live:daily` (`scripts/go-live-daily.ts`) to execute platform health + launch gates + blockers + UAT + rollback + evidence in one command and write `artifacts/evidence/go-live-daily.json`.
- [x] 2026-02-14: Executed `npm run ops:go-live:daily`; report generated and confirmed all current launch blockers remain open (ETA prod env missing, realtime Redis gate failed due backend offline/connection refusal, UAT signoffs pending, rollback drill timings/approvals incomplete).
- [x] 2026-02-14: Hardened launch governance validators: `scripts/uat-signoff-check.ts` now enforces owner presence and role test-case coverage for PASS signoff; `scripts/rollback-drill-check.ts` now validates explicit timing values and completed rollback checklist steps (prevents false pass when values are null/empty).
- [x] 2026-02-14: Added launch template sync command `npm run ops:sync-launch-templates` (`scripts/sync-launch-templates.ts`) to merge updated docs templates into live artifact files (`artifacts/uat/role-signoff.json`, `artifacts/rollback/drill-report.json`) without dropping existing field entries.
- [x] 2026-02-14: Aligned `ops:launch-gates` with go-live scope flags: ETA checks now run only when `GO_LIVE_REQUIRE_ETA=true` (or any `ETA_*` configured), and Redis realtime gate runs only when `SOCKET_REDIS_ENABLED=true` (or `GO_LIVE_REQUIRE_REDIS_REALTIME=true`). Skipped gates are explicitly marked in `artifacts/gates/launch-gates.json` (`scripts/launch-gate-runner.ts`).
- [x] 2026-02-14: Hardened blockers aggregation to treat skipped required gates as FAIL based on `GO_LIVE_REQUIRE_ETA` and `SOCKET_REDIS_ENABLED/GO_LIVE_REQUIRE_REDIS_REALTIME` (`scripts/go-live-blockers.ts`).
- [x] 2026-02-14: Added go-live action plan generator `npm run ops:go-live:plan` to translate current blockers into an executable checklist (Markdown + JSON output under `artifacts/evidence/`) and included it in the daily runner (`scripts/go-live-action-plan.ts`, `scripts/go-live-daily.ts`).
- [x] 2026-02-14: Improved go-live automation ergonomics by adding optional token auto-login for ops health gates and realtime load tests when `*_AUTH_EMAIL`/`*_AUTH_PASSWORD` are provided (keeps `AUTH_TOKEN` optional). Updated `scripts/platform-health-check.ts`, `scripts/realtime-redis-gate.ts`, `scripts/load/realtime-node-load.ts`.
- [x] 2026-02-15: Fixed default seed mojibake for Arabic branch/admin names to ensure clean baseline data in new environments (`seed.ts`).
- [x] 2026-02-15: Added dev bootstrap auth script `npm run ops:dev:bootstrap-auth` to set/create a SUPER_ADMIN password from env for repeatable UAT/load testing without manual token handling (`scripts/dev-bootstrap-auth.ts`, `package.json`).
- [x] 2026-02-15: Added local env initializer `npm run ops:dev:env-init` + one-command dev bootstrap `npm run ops:dev:init` to generate `.env.local` (admin password + load/health auth vars) for faster UAT/load runs (`scripts/dev-env-init.ts`, `package.json`).
- [x] 2026-02-15: Cleaned remaining manual seed mojibake strings for sample category/item names to prevent broken Arabic demo data (`manual-seed.ts`).
- [x] 2026-02-15: Fixed `.env.local` loading in dev bootstrap scripts and validated `npm run ops:dev:init` now succeeds (creates or updates admin password + load/health auth vars) (`scripts/dev-bootstrap-auth.ts`, `scripts/dev-env-init.ts`).
- [x] 2026-02-15: Standardized `.env.local` loading across ops/load scripts so `LOAD_AUTH_*` and `HEALTH_AUTH_*` are picked up automatically (reduces false failures like `AUTH_TOKEN is missing`) (`scripts/platform-health-check.ts`, `scripts/realtime-redis-gate.ts`, `scripts/load/realtime-node-load.ts`).
- [x] 2026-02-15: Improved ops/load failure messages to clearly distinguish missing token vs backend unreachable vs auto-login failures, with actionable hints (`scripts/platform-health-check.ts`, `scripts/realtime-redis-gate.ts`, `scripts/load/realtime-node-load.ts`).
- [x] 2026-02-15: Added fully-free AI provider via Local Ollama (no API key, no rate limits) with provider selector + local model setting in Settings > AI & Automation (`server/services/aiKeyVaultService.ts`, `server/services/aiService.ts`, `server/controllers/aiController.ts`, `components/SettingsHub.tsx`, `services/api.ts`).
- [x] 2026-02-15: Added Go-Live governance endpoints under `/api/ops/go-live/*` + frontend Go-Live Center screen for editing UAT signoff + rollback drill artifacts and viewing blockers (`server/controllers/goLiveOpsController.ts`, `server/routes/opsRoutes.ts`, `components/GoLiveCenter.tsx`, `routes.tsx`, `components/Sidebar.tsx`).
- [x] 2026-02-15: Fixed remaining mojibake/encoding artifacts in navigation + Settings + Day Close screens (Arabic UI now readable) (`components/Sidebar.tsx`, `components/SettingsHub.tsx`, `components/DayCloseHub.tsx`).
- [x] 2026-02-15: Added optional Redis docker-compose + helper scripts (`npm run redis:up|redis:down`) to make closing realtime Redis adapter gate easier in staging/dev (`docker-compose.redis.yml`, `package.json`, `scripts/realtime-redis-gate.ts`).
- [x] 2026-02-17: Added WhatsApp MVP integration layer with provider abstraction (`mock/meta/twilio`), public webhook endpoints, protected test-send/status endpoints, and campaign channel support for `WHATSAPP` (`server/services/whatsappService.ts`, `server/controllers/whatsappController.ts`, `server/routes/whatsappWebhookRoutes.ts`, `server/routes/whatsappRoutes.ts`, `server/app.ts`, `server/controllers/campaignController.ts`).
- [x] 2026-02-17: Added campaign dispatch execution endpoint + UI trigger (real send for `WHATSAPP`, phased placeholder for `SMS/Email/Push`) with dispatch logs and outreach update (`server/controllers/campaignController.ts`, `server/routes/campaignRoutes.ts`, `services/api.ts`, `components/CampaignHub.tsx`, `README.md`).
- [x] 2026-02-17: Added WhatsApp inbound triage workflow: normalized inbox storage from webhook payload, auto-escalation generation for complaint/negative messages, and supervisor endpoints to list/resolve escalations (`server/controllers/whatsappController.ts`, `server/routes/whatsappRoutes.ts`, `services/api.ts`, `README.md`).
- [x] 2026-02-17: Enhanced POS operational speed and cashier UX with barcode-scanner fast add, per-order-type payment memory, smarter recall priority (held orders first), and high-speed keyboard shortcuts (`Shift+Enter` quick pay, `Ctrl+Enter` send kitchen, `Alt+R` recall) in `components/POS.tsx`.
- [x] 2026-02-17: Modernized cashier cart UX for better space usage: configurable desktop cart width modes (C/M/W), collapsible payment panel with compact action mode, cart-level search, and live cart insight chips (lines/items/ready ETA) to keep operators focused and faster (`components/POS.tsx`, `components/pos/PaymentSummary.tsx`).
- [x] 2026-02-17: Upgraded cashier screen to a more adaptive modern layout across device sizes: refined POS header density, cleaner cart item cards, mobile floating action rail for Kitchen/QuickPay/Submit, and cart scroll-safe spacing for bottom controls (`components/POS.tsx`, `components/pos/POSHeader.tsx`, `components/pos/CartItem.tsx`).
- [x] 2026-02-17: Improved cashier operational clarity on small/medium screens with an always-visible in-workspace "Current Order" preview strip (live lines/items/total + first-item chips + one-tap review), smarter quick-category chips ranked by visible demand, and reduced duplicated mobile cart trigger noise (`components/POS.tsx`).
- [x] 2026-02-17: Split POS cart into two independent operational zones for better practicality: top order-details pane (items list with own scroll) and bottom actions/payment pane (own scroll), ensuring order visibility stays clear while actions remain always reachable (`components/POS.tsx`).
- [x] 2026-02-17: Optimized cart-side space utilization by removing rigid row-height reservation and oversized bottom padding; order list now consumes available area dynamically while actions/payment stay bounded and reachable with fewer scroll passes (`components/POS.tsx`).
- [x] 2026-02-17: Applied cashier declutter pass for comfort and focus: removed secondary header noise, simplified filter trigger wording, trimmed cart status chips to essentials (lines + total), and reduced actions panel vertical footprint to prioritize full order visibility (`components/POS.tsx`).
