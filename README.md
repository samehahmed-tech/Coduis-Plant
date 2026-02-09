# RestoFlow ERP

<p align="center">
  <img src="/public/logo.png" alt="RestoFlow ERP Logo" width="150"/>
</p>

<p align="center">
  <strong>A modern, offline-first Restaurant ERP System.</strong>
</p>

---

## Overview

RestoFlow ERP is an ambitious project to build a comprehensive, modern, and scalable Enterprise Resource Planning (ERP) system tailored for the restaurant industry. It features a sophisticated and responsive frontend built with React and a backend powered by Node.js and PostgreSQL.

The system is designed with an **offline-first architecture** in mind, intended to ensure operational continuity even without a stable internet connection. It is a feature-rich platform encompassing everything from Point of Sale (POS) and inventory management to advanced AI-driven analytics.

**This project is currently at a Proof-of-Concept (POC) stage.** It features a well-designed and visually complete frontend, but the backend and core architectural components require significant development to become production-ready.

---

## Key Features (Vision)

The project envisions a wide array of integrated modules:

-   **Point of Sale (POS):** A modern, intuitive interface for order taking, payment processing, and bill splitting.
-   **Inventory Management:** Real-time stock tracking, item management, warehouse organization, and stock adjustments.
-   **Menu & Recipe Manager:** Tools for creating and managing menu items, ingredients, and recipes.
-   **Table & Floor Designer:** A visual interface to design and manage restaurant floor layouts.
-   **Kitchen Display System (KDS):** A digital order display for kitchen staff.
-   **CRM:** Customer relationship management to track customer data and order history.
-   **Finance & Reporting:** Dashboards and reports for financial tracking and business analytics.
-   **AI-Powered Insights:** An advanced module for intelligent alerts, sales forecasting, and data-driven suggestions.
-   **Security & Forensics Hub:** A centralized module for monitoring and auditing system activity.

---

## Tech Stack

| Component            | Technology                                            |
| -------------------- | ----------------------------------------------------- |
| **Frontend**         | React, Vite, TypeScript, Zustand, Tailwind CSS        |
| **Backend**          | Node.js, Express                                      |
| **Database**         | PostgreSQL, Drizzle ORM                               |
| **State Management** | Zustand (with domain-specific stores)                 |
| **DevOps & Tooling** | `tsx` for running TypeScript, `concurrently` for dev   |

---

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm
-   A running PostgreSQL database instance

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd restoflow-erp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory and start by copying `.env.example`. Required variables:
    -   `DATABASE_URL` - PostgreSQL connection string
    -   `JWT_SECRET` - required for auth tokens
    -   `AUDIT_HMAC_SECRET` - required for audit log signatures

    Common optional variables:
    -   `API_PORT` - backend port (default `3001`)
    -   `CORS_ORIGINS` - comma-separated allowed origins (e.g. `http://localhost:3000,http://10.127.244.91:3000`)
    -   `JWT_EXPIRES_IN` - token expiration (default `12h`)
    -   `AUTH_LOGIN_WINDOW_MS` - login throttle window in ms (default `900000`)
    -   `AUTH_LOGIN_MAX_IP_ATTEMPTS` - max failed logins per IP in window (default `40`)
    -   `AUTH_LOGIN_MAX_EMAIL_ATTEMPTS` - max failed logins per email in window (default `8`)
    -   `AUTH_LOGIN_BLOCK_MS` - temporary login block duration in ms (default `900000`)
    -   `AUTH_SESSION_TTL_HOURS` - maximum active session lifetime in hours (default `12`)
    -   `AUTH_MFA_ISSUER` - TOTP issuer name shown in authenticator apps (default `RestoFlow ERP`)
    -   `AUTH_MFA_ENFORCE_ADMIN_FINANCE` - force MFA challenge for `SUPER_ADMIN` and `FINANCE` roles (`true|false`)
    -   `S3_*` - enable image uploads to object storage
    -   `VITE_API_URL` - frontend API base URL
    -   `VITE_SOCKET_URL` - optional explicit socket URL (leave empty to use same origin)
    -   `VITE_OPENROUTER_API_KEY`, `VITE_GEMINI_API_KEY` - AI providers
    -   `VITE_FIREBASE_*` - Firebase integration
    -   `ETA_*` - Egyptian Tax Authority integration (receipts, signatures, branch data)
    -   For production deployments, use `.env.production.example` as the baseline.

### CI Verification (Local)
Run the same quality gate used in CI:
```bash
npm run ci:verify
```

### ETA Test Flow (Quick)
1.  Ensure ETA environment variables are set in `.env` (all `ETA_*` keys).
2.  Run the app and create an order, then mark it as `DELIVERED` or `COMPLETED`.
3.  Open `Fiscal Hub` and use the `Submit to ETA` button (or enter an Order ID and submit).
4.  Review `fiscal_logs` via the UI or `/api/fiscal/logs` for submission status.

### ETA Smoke Test (CLI)
Run a direct end-to-end smoke test that inserts a paid order and triggers ETA submission:
```bash
npx tsx scripts/eta-e2e-smoke.ts
```
Expected output:
- `fiscalLogStatus: "SUBMITTED"` when ETA is configured and reachable.
- `fiscalLogStatus: "FAILED"` with `lastError` when required ETA config is missing.

### ETA Config Preflight
Validate ETA environment keys before smoke test:
```bash
npm run eta:check
```

### Online / Offline Production Model
- Architectural decision document: `docs/ONLINE_OFFLINE_ARCHITECTURE.md`
- Current production model:
  - Server source of truth: PostgreSQL
  - Offline local queue/cache: IndexedDB (Dexie)

### Realtime Scaling (Socket.IO + Redis)
To run Socket.IO across multiple backend instances:
1. Set in `.env`:
   - `SOCKET_REDIS_ENABLED=true`
   - `SOCKET_REDIS_URL=redis://<host>:6379`
2. Start multiple API instances behind a load balancer with sticky sessions.
3. Verify runtime health:
   - `GET /api/ops/realtime-health` (requires `SUPER_ADMIN` token)

### Load Test (1000 Realtime Connections)
Use k6 script:
```bash
k6 run scripts/load/realtime-1000.js
```
Optional env:
- `API_BASE=http://localhost:3001`
- `WS_BASE=ws://localhost:3001/socket.io/?EIO=4&transport=websocket`
- `AUTH_TOKEN=<jwt>`

Fallback without k6 (Node-based smoke load):
```bash
npm run load:realtime:node
```
Optional env:
- `API_BASE=http://localhost:3001`
- `SOCKET_BASE=http://localhost:3001`
- `AUTH_TOKEN=<jwt>`
- `WS_CLIENTS=200`

4.  **Run Database Migrations:**
    The project uses Drizzle ORM for schema management. Apply the migrations to your database:
    ```bash
    npm run db:push:force
    ```
    *Note: As the project evolves, a more robust migration strategy using `npm run db:generate` and `npm run db:migrate` should be adopted.*

### Existing Data Fix (zones/table FK)
If your database had legacy tables before `floor_zones` constraints were added, run:
```bash
npm run db:fix:zones
npm run db:inspect:zones
npm run db:push:force
```

### Running the Application

-   **Run Frontend and Backend concurrently (Recommended):**
    ```bash
    npm run dev:all
    ```
-   **Run only the Frontend:**
    ```bash
    npm run dev
    ```
-   **Run only the Backend Server:**
    ```bash
    npm run server
    ```

---

## Project Analysis and Strategic Roadmap

This analysis provides a clear view of the project's current state and a strategic roadmap to guide its development from a POC to a production-ready application.

### Current State: A Tale of Two Halves

1.  **The Visionary Frontend:** The frontend is the most mature part of the project. It's a well-structured, visually appealing prototype that clearly outlines the project's ambitious goals. The component-based architecture and domain-driven state management (via Zustand) provide a solid foundation.

2.  **The Prototype Backend:** The backend, contained entirely in `server/index.ts`, is a minimal prototype. It uses raw `pg` queries and lacks the structure, security, and scalability required for an ERP system. It serves as a placeholder to support the UI but does not reflect the sophisticated data model defined in the schema.

### Key Architectural Gaps & Recommendations

1.  **Critical Security Gap:**
    -   **Finding:** The backend has **no authentication or authorization**. All endpoints are open, posing a massive security risk.
    -   **Recommendation:** Implement JWT-based authentication. Create middleware to protect all API routes. Introduce Role-Based Access Control (RBAC) based on the `users.role` field in the database schema to restrict access to sensitive modules like Finance and Settings.

2.  **Non-Functional Sync Engine:**
    -   **Finding:** The core "offline-first" capability hinges on the `syncEngine.ts`, which is currently a mock using `localStorage`. This cannot reliably queue events or handle complex offline scenarios.
    -   **Recommendation:** Re-implement the sync engine using a robust client-side database like **IndexedDB** (e.g., via a library like `dexie.js`). This is the highest architectural priority to fulfill the project's vision.

3.  **Backend Immaturity & ORM Mismatch:**
    -   **Finding:** The backend is a single monolithic file and does not use the Drizzle ORM, despite a comprehensive schema being defined with it. This leads to code duplication, potential for SQL injection, and a disconnect between the data model and its implementation.
    -   **Recommendation:** **Refactor the entire backend.** Break it into a modular structure (e.g., `/server/routes`, `/server/controllers`, `/server/services`). Adopt the **Drizzle ORM** for all database interactions to ensure type safety and align with the defined schema.

4.  **Inefficient Image Handling:**
    -   **Finding:** The schema suggests storing images as `bytea` (binary data), likely leading to base64 strings in the database. This is not scalable and will quickly bloat the database, harming performance.
    -   **Recommendation:** Integrate a dedicated object storage solution like **AWS S3, Google Cloud Storage, or a self-hosted MinIO instance**. The database should only store the URL or key to the image.

5.  **Complete Lack of Testing & CI/CD:**
    -   **Finding:** There are no automated tests (unit, integration, or e2e) or a CI/CD pipeline. This makes the project impossible to scale or maintain reliably.
    -   **Recommendation:** Introduce a testing framework like **Vitest** for unit and integration tests. Set up a basic CI/CD pipeline using **GitHub Actions** to run linting, tests, and builds on every pull request.

### Recommended Development Roadmap

This roadmap outlines a path to transform the RestoFlow ERP from a POC into a robust, scalable application.

#### Phase 1: Build the Foundation (Backend & Security)

-   [ ] **Refactor the Backend:** Break `server/index.ts` into a modular MVC or service-oriented architecture.
-   [ ] **Implement Security:** Add JWT authentication, password hashing, and protected routes.
-   [ ] **Implement RBAC:** Create middleware to enforce roles and permissions.
-   [ ] **Adopt Drizzle ORM:** Replace all raw SQL queries in the backend with Drizzle queries.

#### Phase 2: Fulfill the Core Architecture (Offline & Storage)

-   [ ] **Implement the Sync Engine:** Replace the `localStorage` mock with a real IndexedDB-based queuing system.
-   [ ] **Externalize Image Storage:** Build an image service to handle uploads to a dedicated object store.

#### Phase 3: Ensure Quality & Stability

-   [ ] **Introduce Unit & Integration Tests:** Start by writing tests for backend services and frontend state stores.
-   [ ] **Set Up CI/CD:** Create a GitHub Actions workflow to automate linting, testing, and building.

#### Phase 4: Feature Completion & Polish

-   [ ] **Connect the Dots:** Wire up the placeholder services (`firestoreService`, `geminiService`, etc.) to their respective UI components.
-   [ ] **Build Missing Endpoints:** Implement the remaining backend logic required by the frontend, following the Drizzle schema.
-   [ ] **Enhance UX/UI:** Conduct a full review of the user experience, ensuring consistency, accessibility, and responsiveness.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is currently unlicensed. Please contact the project owner for more information.
