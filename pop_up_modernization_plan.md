# Plan: POS Pop-up Modernization (v1.2)

The objective is to overhaul all POS modals (pop-ups) to ensure they are visually stunning, high-contrast (legible in all lighting conditions), and provide a premium "Glassy" feel that matches the new RestoFlow v1.1 design system.

## 1. Core Visual Principles
- **Vibrant Hierarchy**: Use strong, unambiguous colors for primary actions (Emerald for Success/Edit, Indigo for Primary, Rose for Danger/Void).
- **Glassmorphism 2.0**: Enhanced backdrop-blurs with subtle borders to ensure pop-ups stand out from the background.
- **Micro-Animations**: Use `framer-motion` for spring-based entrance/exit and reactive hover states.
- **RTL Optimization**: Ensure all layouts respect Arabic/English flow seamlessly.

## 2. Component Audits & Improvements

### A. ShiftOverlays (Open/Close Shift)
- **Problem**: Current design is functional but looks "standard".
- **Fix**: Redesign as a "Premium Lock Screen".
  - Use high-contrast numeric inputs.
  - Add gradient backgrounds for shift status cards.
  - Enhance the "Report" view after closing a shift.

### B. ManagerApprovalModal (Void Authorization)
- **Problem**: Pin pad looks a bit flat.
- **Fix**: Modernize to a "Security Vault" aesthetic.
  - Rounder, high-contrast keys with shadow feedback.
  - Better visual feedback for PIN entry (glowing dots).
  - Clearer "Action Name" badge.

### C. NoteModal & CourseModal
- **Problem**: Likely using standard inputs/buttons.
- **Fix**: Redesign to match the "Table Map" aesthetic.
  - Large, touchable buttons for preset notes/courses.
  - Glassy input fields with primary focus states.

### D. TableManagementModal (Refinement)
- **Problem**: Contrast issues in light mode (as seen in user screenshot).
- **Fix**: 
  - Switch to darker gradient pairs (e.g., `emerald-600` to `teal-700`).
  - Add a subtle inner shadow to buttons.
  - Ensure `disabled` state is legible but distinct.

## 3. Implementation Workflow
1.  **Update `ShiftOverlays.tsx`**: Modernize the Open/Close shift experience.
2.  **Update `ManagerApprovalModal.tsx`**: Enhance the PIN authorization pad.
3.  **Update `NoteModal.tsx` & `CourseModal.tsx`**: Align accessory modals with the new design.
4.  **Final Polish on `TableManagementModal.tsx`**: Fix contrast issues and verify responsiveness.

---
**Next Step**: I will begin with the `ShiftOverlays.tsx` modernization.
