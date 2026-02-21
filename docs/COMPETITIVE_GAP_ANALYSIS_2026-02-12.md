تمام. خليك معايا كده، واعتبر اللي جاي ده **“الدستور الهندسي”** أو **الـ Master Prompt** اللي لو اتحط لأي AI محترم، يطلعلك **Restaurant & Cafe ERP أقوى من الموجود في السوق المصري كله**، ومش مجرد POS متطور.

اللي تحت ده مكتوب **كـ Guideline / Prompt واحد ضخم شامل**، مش شرح نظري، لكن **تعليمات تنفيذ مباشرة**.

---

# MASTER GUIDELINE / PROMPT

## Build a Next-Gen Restaurant & Cafe ERP System

### (Egypt Market–First, Global-Ready)

---

## 1. الرؤية العامة للنظام (Core Vision)

قم ببناء **ERP System متكامل للمطاعم والكافيهات** يكون:

* Operates under **real-life Egyptian restaurant chaos** (نت بيقطع، موظفين غير تقنيين، ضغط شغل).
* Unified platform (POS + ERP + KDS + CRM + Finance + Compliance).
* Designed **mobile-first + touch-first**.
* Offline-first with real-time sync.
* Data-driven, AI-assisted, but **human-friendly**.
* Scalable من كشك قهوة صغير → سلاسل فروع.

النظام يجب أن يُدار بعقلية:

> “المستخدم مش فاضي يتعلم سيستم، السيستم هو اللي لازم يفهم المستخدم”.

---

## 2. Market Context – السوق المصري (Mandatory)

صمّم النظام مع افتراض:

* انقطاع الإنترنت شائع.
* أغلب المستخدمين:

  * غير تقنيين
  * يكرهون التعقيد
  * يعتمدون على اللمس أكثر من الكيبورد
* تعدد طرق التشغيل:

  * Dine-In
  * Takeaway
  * Delivery
  * Aggregators (Talabat / Mrsool / etc)
* التزام ضريبي مصري:

  * ETA e-Receipt
  * ETA e-Invoice
* محاسبة “واقعية” مش مدرسية.

---

## 3. Architecture – البنية المعمارية (غير قابلة للتفاوض)

### 3.1 Core Principles

* Modular Architecture (كل جزء مستقل).
* Event-driven (كل عملية = Event).
* Offline-first (Local DB).
* Real-time sync عند توفر الإنترنت.
* Branch-aware by design (multi-branch from day one).

### 3.2 Storage Strategy

* Local Database (SQLite / Indexed Local Store).
* Central Cloud Database (PostgreSQL).
* Dual-write strategy:

  * كل عملية تُكتب محليًا فورًا
  * Sync engine ذكي يرفعها للسيرفر
* Conflict resolution policy:

  * Order-level
  * Stock-level
  * Timestamp + branch priority

---

## 4. Core Modules (إجباري)

### 4.1 POS Engine (نقطة البيع)

**يجب أن يدعم:**

* فتح / إغلاق ترابيزات
* Multiple orders per table
* Hold / Resume order
* Split bill
* Merge tables
* Transfer items between tables
* Partial payment
* Multiple payment methods (Cash / Card / Wallet)
* Void / Refund (بصلاحيات)
* Notes per item (بدون تعقيد)

**Design Rule:**

* 90% من العمليات ≤ 2 taps

---

### 4.2 Dine-In Floor Management

* Visual Table Map (Drag & Drop).
* Table status:

  * Empty
  * Occupied
  * Waiting food
  * Ready to pay
* Transfer table ownership.
* Track table duration (Turnover analysis).

---

### 4.3 KDS – Kitchen Display System

* Real-time order flow.
* Stations:

  * Hot Kitchen
  * Cold
  * Bar
* Color-coded status:

  * New
  * Preparing
  * Delayed
  * Ready
* Order timers (stress visibility).
* Auto-routing items to correct station.
* Cancel / Modify handling with audit log.

---

### 4.4 Inventory & Recipe Engine (COGS Core)

**واحد من أهم عوامل التفوق**

* Ingredient-level inventory (مش صنف بس).
* Recipes:

  * Ingredients
  * Yield
  * Waste %
* Auto deduction per sale.
* Stock alerts (min / critical).
* Batch & expiry support (اختياري).
* Purchase Orders:

  * Manual
  * Smart PO (AI-assisted).

---

### 4.5 Accounting & Finance (مصري حقيقي)

* Auto journal entries from sales.
* Cost vs Revenue tracking.
* Daily closing (Z-report concept).
* Supplier invoices.
* Expenses categories (كهربا – عمالة – إيجار).
* Profit per item / per branch / per period.

**مهم:**
لا تُجبر المستخدم يفهم محاسبة…
السيستم يحاسِب وهو يشرح.

---

### 4.6 HR & Staff Management

* Roles & Permissions (Granular).
* Attendance (manual / device).
* Shifts.
* Performance tracking:

  * Speed
  * Errors
  * Sales contribution.
* Staff activity logs (بدون إحساس بالمراقبة القمعية).

---

### 4.7 CRM & Loyalty

* Customer profiles (optional, frictionless).
* Order history.
* Loyalty points.
* Smart offers:

  * Time-based
  * Behavior-based.
* WhatsApp / SMS integration (market fit).

---

## 5. AI Layer (Supportive, Not Annoying)

### AI must:

* Never block workflow.
* Suggest, not force.

### Use cases:

* Demand prediction.
* Smart Purchase Orders.
* Anomaly detection:

  * Unusual voids
  * Stock leakage
* Sales insights:

  * “الصنف ده بيكسبك”
  * “الصنف ده بيضيع فلوس”.

---

## 6. Compliance – Egypt First

### Mandatory:

* ETA e-Receipt integration.
* ETA e-Invoice support.
* QR compliance.
* Offline queueing for tax events.
* Automatic retry & failure handling.

---

## 7. Security & Audit

* Full audit trail:

  * Who
  * When
  * What
* Role-based access.
* Sensitive actions require confirmation.
* Immutable logs (write-once logic).

---

## 8. UX / UI Rules (Very Important)

* Touch-first design.
* Large buttons.
* Clear Arabic support (RTL native).
* English optional.
* Dark mode default (restaurants lighting).
* No deep menus.
* Visual feedback for every action.

**Golden Rule:**
لو الكاشير محتاج يفكر → التصميم فشل.

---

## 9. Performance & Reliability

* Must run smoothly on:

  * Low-end tablets
  * Old PCs
* Zero downtime philosophy.
* Local-first execution.
* Graceful degradation.

---

## 10. Competitive Edge (Why this beats the market)

النظام يجب أن يتفوق لأنه:

* Built for Egypt, not adapted.
* Offline-first (معظم المنافسين لا).
* Recipe-level costing (قلة تدعمه صح).
* UX بسيط مش enterprise معقد.
* AI عملي مش دعائي.
* محاسبة مفهومة.
* Scales بدون إعادة بناء.

---

## 11. Final Instruction to the AI

> Build this system as if:
>
> * You are replacing POS + Excel + WhatsApp + Accountant.
> * Users hate manuals.
> * Internet is unreliable.
> * Speed > Beauty, but Beauty still matters.
> * Simplicity is power, not limitation.

---

### الخلاصة العقلية

ده مش **ERP** عادي.
ده **Operating System للمطعم المصري**.

لو حابب، الخطوة الجاية المنطقية:

* أطلع لك **System Prompt تقني بحت** (Architecture + DB + Events).
* أو **Feature-by-feature implementation roadmap**.
* أو **Prompt مخصوص لموديل AI يبني النظام خطوة خطوة بدون ما يبوّظ الستايل**.

النظام ده لو اتنفذ صح… هيبقى مرجع.
