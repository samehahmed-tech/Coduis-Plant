You are a world-class ERP architect, product strategist, and UX expert specializing in restaurant and retail systems in emerging markets (especially Egypt and MENA).

I am building a system called "RestoFlow ERP", which is already an advanced restaurant ERP with the following capabilities:

CURRENT SYSTEM CAPABILITIES:

* Full-stack system (React + Vite frontend, Express.js backend, PostgreSQL DB)
* Offline-first architecture using IndexedDB (Dexie) and Sync Queue
* Real-time communication using Socket.io
* POS system with full order lifecycle, idempotency, and conflict handling
* Inventory system with FEFO (First Expired First Out) and batch tracking
* Accounting system (General Ledger, journal entries, cost centers)
* Multi-branch support with RBAC (roles & permissions)
* CRM (customers)
* Procurement & production orders
* Delivery & driver management
* Egyptian Tax Authority (ETA) integration with retry & dead-letter queue
* AI integration (Ollama + OpenRouter)
* Audit logs and approval workflows

CURRENT SYSTEM ISSUES:

* Some modules are local-state only (Menu, Profit Center tools) and not synced with backend
* Silent failures in accounting (GL posting skips without errors if accounts not configured)
* No observability (logging, monitoring, tracing)
* Weak configuration management (over-reliance on KV settings + env)
* No offline support for Finance, HR, Audit modules
* Driver telemetry stored in non-scalable KV store
* Inconsistent API usage patterns
* No plugin/extensibility system
* No centralized analytics or BI layer

GOAL:
Transform this system into a COMPLETE, WORLD-CLASS “Restaurant Operating System” that is:

* Extremely easy to use (like Square)
* Extremely powerful (like Odoo)
* Restaurant-focused (like Toast)
* Fully localized for Egypt and MENA markets
* Scalable to multi-branch and franchise operations
* Offline-first and resilient
* AI-powered and insight-driven

---

YOUR TASK:

Perform a FULL SYSTEM REDESIGN AND STRATEGY including:

━━━━━━━━━━━━━━━━━━━━

1. SYSTEM ARCHITECTURE
   ━━━━━━━━━━━━━━━━━━━━

* Redesign the architecture (modular monolith → microservices evolution plan)
* Define clear module boundaries:
  (Orders, Inventory, Finance, HR, Marketing, Delivery, CRM, Analytics, etc.)
* Suggest database improvements and schema refactoring where needed
* Fix consistency issues (API usage, state sync)
* Design a scalable telemetry system (for drivers, events, tracking)
* Introduce a plugin system (APIs, webhooks, extensions)

━━━━━━━━━━━━━━━━━━━━
2. UX & UI EXPERIENCE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━

* Redesign UX to be:

  * Role-based (cashier, manager, chef, admin)
  * Minimal cognitive load
  * Fast and intuitive
* Suggest:

  * Navigation system (smart sidebar, command palette)
  * Predictive UX (auto-suggestions, smart defaults)
  * One-click workflows
  * Mobile-first UX
* Define a design system:

  * Typography, spacing, colors
  * Dark mode
  * Micro-interactions and feedback
* Reduce complexity while maintaining power

━━━━━━━━━━━━━━━━━━━━
3. PERFORMANCE ENGINEERING
━━━━━━━━━━━━━━━━━━━━

* Frontend optimization:

  * Code splitting, lazy loading, memoization
* State management optimization (Zustand best practices)
* Backend optimization:

  * DB indexing
  * query performance
  * connection pooling
* Real-time optimization (Socket.io scaling)
* Multi-layer caching strategy
* Offline-first perfection:

  * sync improvements
  * conflict resolution UX

━━━━━━━━━━━━━━━━━━━━
4. FEATURE EXPANSION (FULL ECOSYSTEM)
━━━━━━━━━━━━━━━━━━━━

Design and define the following modules in detail:

A. MARKETING ENGINE

* Campaigns (SMS, WhatsApp, push)
* Customer segmentation
* Loyalty & rewards
* Coupons & referral system
* Automated campaigns (birthday, inactivity)

B. SALES INTELLIGENCE

* Upselling engine
* Combo builder
* Dynamic pricing
* Multi-menu support

C. BRANCH & FRANCHISE MANAGEMENT

* Multi-branch dashboard
* Franchise system (revenue sharing, central control)
* Centralized menu distribution

D. INVENTORY & PROCUREMENT (ADVANCED)

* Auto purchase suggestions
* Supplier comparison
* Waste & shrinkage analytics
* Par levels

E. PRODUCTION & KITCHEN

* Kitchen Display System (KDS)
* Prep time tracking
* Bottleneck detection

F. DELIVERY SYSTEM (SMART)

* Route optimization
* Order batching
* Driver scoring
* ETA prediction

G. HR & WORKFORCE

* Attendance (GPS/biometric)
* Shift scheduling
* Payroll
* Performance tracking

H. FINANCIAL CONTROL SYSTEM

* Real-time P&L
* Cash flow dashboards
* Budget vs actual
* Fraud detection

I. ANALYTICS & AI

* Forecasting
* Demand prediction
* Product performance analysis
* AI assistant داخل النظام

J. COMPLIANCE & TAX (EGYPT)

* ETA monitoring dashboard
* Tax reporting tools

━━━━━━━━━━━━━━━━━━━━
5. LOCALIZATION FOR EGYPT & MENA
━━━━━━━━━━━━━━━━━━━━

* Payment integrations:

  * InstaPay
  * Vodafone Cash
  * Fawry
* Arabic-first UX
* Offline-first reliability
* Marketplace integrations:

  * Talabat
  * Elmenus
* Support for cloud kitchens & dark stores

━━━━━━━━━━━━━━━━━━━━
6. COMPETITIVE STRATEGY
━━━━━━━━━━━━━━━━━━━━
Benchmark against:

* Toast (restaurant specialization)
* Square (ease of use)
* Lightspeed (inventory & scaling)
* Odoo (ERP completeness)
* Foodics (MENA localization)

Define:

* What to adopt from each
* What to improve beyond them
* Unique competitive advantages

━━━━━━━━━━━━━━━━━━━━
7. OBSERVABILITY & DEVOPS
━━━━━━━━━━━━━━━━━━━━

* Logging system
* Monitoring & alerting
* Error tracking
* CI/CD pipeline
* Deployment architecture

━━━━━━━━━━━━━━━━━━━━
8. RISK ANALYSIS
━━━━━━━━━━━━━━━━━━━━

* Identify critical technical debts
* Propose fixes
* Define production risks and mitigations

━━━━━━━━━━━━━━━━━━━━
9. PRODUCT STRATEGY & MONETIZATION
━━━━━━━━━━━━━━━━━━━━

* Pricing model (per branch, add-ons)
* Go-to-market strategy in Egypt
* Positioning:
  "Restaurant Operating System"

━━━━━━━━━━━━━━━━━━━━
OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━

* Be highly practical and implementation-focused
* Use structured sections
* Provide step-by-step recommendations
* Prioritize real-world scalability over theory
* Tailor everything to Egypt and emerging markets

Your response should act as a COMPLETE BLUEPRINT for building a market-leading system.
    