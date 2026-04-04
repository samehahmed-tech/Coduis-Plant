# RestoFlow Launch Readiness Checklist

Date: 2026-03-29
Owner: Codex execution stream
Status: Active

## Goal

تحويل المشروع من حالة feature-heavy مع فجوات تشغيلية إلى نظام ERP مطاعم جاهز للتجربة الميدانية ثم الإطلاق المرحلي.

## P0 - Release Blockers

- [x] إصلاح جميع أخطاء `TypeScript` الحالية وإرجاع `npx tsc --noEmit` إلى النجاح.
- [x] إصلاح خطوة التغطية في CI عبر تثبيت واعتماد `@vitest/coverage-v8`.
- [~] توحيد عقود الـ API بين `frontend`, `backend`, و`tests` خصوصًا تدفقات `orders/auth`.
- [~] إصلاح اختبارات `E2E` لتعمل على `test database` حقيقية بدون fallback إلى mock mode.
- [~] عزل بيئة الاختبارات بالكامل ومنع أي احتمال للمساس ببيانات التطوير.
- [ ] إزالة التكرار في إنشاء database pools وتوحيد lifecycle الخاص بالاتصال.
- [ ] إغلاق فجوات go-live الحرجة: ETA/Redis/UAT/Rollback evidence الفعلية.

## P1 - Core ERP Completeness

- [ ] استكمال دورة التشغيل الأساسية بشكل production-ready: `POS`, `orders`, `tables`, `KDS`, `printing`, `shift`, `day close`.
- [ ] تقوية إدارة الفروع المتعددة والصلاحيات والنطاقات التشغيلية لكل فرع.
- [ ] استكمال المخزون والمشتريات والتكلفة: counts, reorder, supplier flow, variance, batch/expiry.
- [ ] تقوية المالية: reconciliations, period close, branch P&L, recurring entries, attachments.
- [ ] استكمال `CRM`, `loyalty`, `campaigns`, `platforms`, `WhatsApp`, `refunds`, `fiscal`.
- [ ] تقييم ما يدخل الإطلاق من `HR/People Ops` وما يؤجل بعد الإطلاق.

## P1 - Reliability / Offline / Operations

- [ ] توسيع الـ offline-first architecture ليغطي الدومينات الأساسية فعليًا.
- [ ] تحسين `sync queue`, retries, conflict handling, dead-letter flows.
- [ ] إضافة health dashboards أوضح للخدمات الحرجة: DB / Socket / Print / Fiscal / Providers.
- [ ] مراجعة backup / restore / rollback drills وتشغيلها ميدانيًا بأدلة حقيقية.
- [ ] تجهيز pilot branch rollout بخطة تشغيل ودعم واضحة.

## P1 - Performance / Speed / Responsiveness

- [ ] تقليل أحجام الـ bundles وتحسين `code splitting` للموديولات الثقيلة.
- [ ] تقليل إعادة الجلب وإعادة الرندر غير الضرورية في الـ stores والصفحات الأساسية.
- [ ] إضافة virtualization للجداول والقوائم الكبيرة.
- [ ] تحسين استعلامات التقارير والمخزون والطلبات وفهارس قاعدة البيانات.
- [ ] رفع observability: slow queries, pool pressure, socket latency, queue latency.
- [ ] تحسين سرعة الإقلاع وسلاسة التنقل على الأجهزة الضعيفة والمتوسطة.

## P1 - UI / UX / Product Polish

- [ ] بناء design system أوضح وأكثر اتساقًا عبر النظام.
- [ ] إعادة تنظيم الـ navigation والـ information architecture حسب رحلة العمل الفعلية.
- [ ] توحيد حالات `loading`, `empty`, `error`, `offline`, `permission denied`.
- [ ] تحسين تجربة `tablet/mobile` خصوصًا في `POS`, `KDS`, `Call Center`.
- [ ] تحسين الـ RTL والعربي بشكل كامل على مستوى spacing/icons/tables/forms/charts.
- [ ] تقليل الزحام البصري ورفع وضوح الأولويات في الشاشات الثقيلة.

## P1 - Themes / Visual Redesign

- [ ] تطوير الـ themes الحالية لتكون أكثر نضجًا واتساقًا.
- [ ] إزالة الخلفيات الحالية الضعيفة أو المكررة واستبدالها بخلفيات أجمل وأكثر احترافية.
- [ ] تحسين المظهر النهائي للنظام بالكامل ليصبح أجمل بمراحل مع الحفاظ على طابع ERP احترافي.
- [ ] تحسين `login`, `loading`, `main layout`, `dashboards`, `cards`, `tables`, `modals`, `sidebar`.
- [ ] إضافة gradients / textures / subtle patterns مدروسة بدل الخلفيات الحالية المسطحة.
- [ ] الحفاظ على الأداء أثناء التجميل البصري وعدم تحميل الواجهة بعناصر بطيئة.

## P2 - Launch Management

- [ ] إعداد `launch readiness checklist` نهائية لكل module وكل role.
- [ ] تنفيذ `UAT` فعلي حسب الأدوار التشغيلية.
- [ ] تجهيز production configs وsecurity hardening النهائي.
- [ ] تحديد `must-have` للإطلاق الأول وتأجيل `nice-to-have` لما بعده.
- [ ] تنفيذ rollout على 3 مراحل: `Core Operations Ready` ثم `Management Ready` ثم `Growth Ready`.

## Current Sprint

- [x] إصلاح خطأ `recurringEntriesController` الذي يكسر `tsc`.
- [x] تثبيت تغطية Vitest وتشغيل `npx vitest run --coverage`.
- [x] تحديث ملف `coreOrderFlow.test.ts` ليتوافق مع contract الحالي.
- [ ] مراجعة `tests/setup.ts` لعزل الاختبارات عن بيئة التطوير.
- [ ] بدء تفكيك `services/api.ts` إلى clients حسب domain.
## Latest Progress

- [x] Unified order status validation with server policy so `COMPLETED` is accepted wherever policy allows it.
- [x] Added a regression test to keep `orderStatusPolicy` and `updateOrderStatusSchema` aligned.
- [x] Removed the duplicate PostgreSQL pool from `server/index.ts` and switched shutdown to the shared pool lifecycle in `server/db/index.ts`.
- [~] Test isolation is safer now, but still running in targeted cleanup mode until a dedicated test database is configured.
## Latest Progress

- [x] Extracted dedicated API client modules for `core`, `auth`, and `orders` under `services/api/`.
- [x] Redirected key consumers to the new `auth` and `orders` clients without breaking the existing `services/api.ts` entrypoint.
- [x] Extracted `users`, `branches`, `settings`, and `tables` clients into dedicated modules under `services/api/`.
- [x] Redirected auth, order, sync, floor, franchise, and settings consumers to the new domain clients.
- [x] Extracted `customers`, `menu`, and `inventory` clients into dedicated modules under `services/api/`.
- [x] Redirected CRM, inventory, menu, settings, and sync consumers to the new domain clients.
- [x] Extracted `audit` and `shifts` clients into dedicated modules under `services/api/`.
- [x] Redirected audit, POS, shift overlays, and sync consumers to the new domain clients.
- [x] Extracted a first `reports` subset into a dedicated module for dashboard, finance, fiscal, and inventory surfaces.
- [x] Redirected key KPI/report consumers to the new `services/api/reports.ts` module.
- [x] Expanded `services/api/reports.ts` into a full reports client and redirected `Reports.tsx` and `AIInsights.tsx` to it.
- [x] Extracted `analytics`, `campaigns`, `platforms`, `wastage`, and `refunds` clients into dedicated modules.
- [x] Redirected admin, campaign, platform, wastage, and refund surfaces to the new domain clients.
- [x] Extracted `finance`, `hr`, `hrExtended`, and `ai` clients into dedicated modules under `services/api/`.
- [x] Redirected finance store, HR store, AI assistant, dashboard, settings, AI insights, and HR management surfaces to the new domain clients.
- [x] Extracted `setup`, `ops`, `fiscal`, `printGateway`, and `whatsapp` clients into dedicated modules.
- [x] Redirected app bootstrap, health-init, go-live, fiscal, print queue, and WhatsApp surfaces to the new domain clients.
- [x] Extracted `approval`, `inventoryIntelligence`, `printers`, and `procurement` clients into dedicated modules.
- [x] Redirected approval flows, inventory intelligence surfaces, auth printer sync, and procurement state to the new domain clients.
- [x] Extracted `delivery`, `callCenterSupervisor`, and `dayClose` clients into dedicated modules under `services/api/`.
- [x] Test setup now provisions and targets a dedicated `*_test` PostgreSQL database automatically, then pushes schema before the suite runs.
- [x] Vitest now allows longer setup hooks so dedicated test database provisioning completes reliably on Windows.
- [~] Full `services/api.ts` decomposition is now blocked only by two non-UTF8 consumer files: `CallCenterManager.tsx` and `DayCloseHub.tsx`, which still import from the legacy aggregate.
- [~] Refined the workspace shell with a more premium sidebar, mobile navigation tray, and breadcrumb surface to reduce visual clutter and improve hierarchy.
- [~] Reworked the login experience toward a warmer restaurant-oriented art direction, including updated branding, calmer messaging, and a teal/amber palette.
- [~] Visual redesign is moving forward without regressions: `npx tsc --noEmit` and `npm run build` both remain green after the shell/theme pass.
- [x] Re-encoded `CallCenterManager.tsx` and `DayCloseHub.tsx` to UTF-8, redirected their legacy aggregate imports, and removed the last known consumer-level blocker in the `services/api.ts` decomposition path.
- [~] Moved theme palettes out of the main stylesheet into runtime-loaded per-theme CSS assets, reducing the initial shared CSS payload and keeping theme switching intact.
