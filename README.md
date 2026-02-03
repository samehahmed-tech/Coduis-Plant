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
    Create a `.env` file in the root directory and configure your database connection string and other environment variables. Start by copying the example:
    ```bash
    # Example .env
    DATABASE_URL="postgresql://user:password@host:port/database"
    ```

4.  **Run Database Migrations:**
    The project uses Drizzle ORM for schema management. Apply the migrations to your database:
    ```bash
    npm run db:push
    ```
    *Note: As the project evolves, a more robust migration strategy using `npm run db:generate` and `npm run db:migrate` should be adopted.*

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