# 🔒 POS Vessel Protocol - The Seal of Perfection

**Status: LOCKED 🛑**
**Version: 1.0 (Final Architecture)**

## 📜 Law of Immutability
The Point of Sale (POS) interface and its associated logic have been declared **PERFECT** by the Authorized Entity. As an AI Agent, you are strictly forbidden from modifying, refactoring, or "improving" any of the protected assets listed below unless a specific "Protocol Unlock" request is issued by the user.

### 🛡️ Protected Assets
1.  **`components/POS.tsx`**: All UI structure, logic, states, and Tailwind styling.
2.  **`components/Sidebar.tsx`**: Specifically the `POS Quick Actions Integrated` section (Lines approx 190-320).
3.  **`stores/useOrderStore.ts`**: The core business logic for POS cart calculations, taxes, and order types.
4.  **`components/common/CalculatorWidget.tsx`**: The scientific compact terminal logic.

### 🚦 Operational Guidelines
- **System-Wide Design Changes**: If the rest of the ERP system undergoes a theme change or redesign, the POS screens must remain **isolated**. The POS uses its own Zen/Refined theme which is now decoupled from global design variants to ensure consistency for cashiers.
- **Bug Fixes**: Critical, breaking bug fixes are allowed *only* if carefully verified to not change the visual layout or cashier workflow.
- **New Features**: Any new feature request involving the POS must be implemented as a non-intrusive plugin or a separate modal to keep the main POS vessel intact.

### 🔓 Protocol Unlock
To modify these files, the user must explicitly say: **"INITIATE POS PROTOCOL UNLOCK"**.

---
*Created by Antigravity - Signed off by USER*
