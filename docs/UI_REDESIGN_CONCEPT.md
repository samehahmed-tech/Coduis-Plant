# Restaurant ERP UI Redesign (2026)

Date: 2026-03-12
Owner: Product + Design
Status: Concept + UX Architecture

## 1. Full Redesign Concept
The redesign shifts the system from a classic ERP sidebar into a fast, command-driven workspace with context-aware surfaces. The UI is built around three modes:
- Operate: POS, Orders, Kitchen, Dispatch. Speed first.
- Manage: Menu, Tables, Inventory, Staff. Structure first.
- Analyze: Reports, Finance, KPIs. Clarity first.

Key outcomes:
- Zero-loss of features or logic. All existing modules remain, reorganized.
- Reduced navigation friction with a unified command surface.
- A premium, calm visual language with a light, atmospheric feel suited for long shifts.

## 2. Navigation System Redesign
Replace the traditional sidebar with a tri-layer navigation model:

1. Command Dock (global)
   - `Ctrl+K` opens command palette.
   - Search-first navigation with fuzzy match, quick actions, and recent items.
   - Works on desktop, tablet, and POS touch.

2. Context Rail (left, minimal)
   - Appears only when a module is open.
   - Shows 4-6 primary tasks for the current module.
   - Collapses into a floating pill on POS and tablets.

3. Smart Tabs (top, dynamic)
   - Shows current workspace state: Order #, Table, Kitchen Station, Report range.
   - Tabs are stateful, allowing fast back-and-forth without reloading.

Navigation primitives:
- `CmdPalette`: modules, actions, entity lookup, quick create.
- `QuickSwitch`: swap between active orders or work queues.
- `FocusMode`: hide all chrome for POS and KDS.
- `Recents`: last 10 views, visible in command palette and top bar.

## 3. Design System

### 3.1 Typography
Primary font: `Söhne` (fallbacks: `Space Grotesk`, `Segoe UI`)
Data font: `IBM Plex Mono` (for receipts, codes, audit IDs)
Hierarchy:
- Display 1: 32/40, 600
- Display 2: 24/32, 600
- Title: 18/24, 600
- Body: 14/20, 450
- Caption: 12/16, 450

### 3.2 Spacing Scale
Base: 4
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### 3.3 Color Tokens
Palette is light, neutral, and warm with high-contrast functional states.
- `ink-900`: #101418
- `ink-700`: #2A3138
- `ink-500`: #4F5B66
- `ink-300`: #9AA6B2
- `ink-100`: #E6EDF3
- `paper-0`: #FBFCFE
- `paper-50`: #F5F7FA
- `accent-600`: #2D6CDF
- `accent-400`: #5C8DF2
- `success-600`: #1F8F55
- `warning-600`: #C7831A
- `danger-600`: #CC3B3B

### 3.4 Depth and Effects
- Soft elevation: 0, 1, 2, 3 with subtle shadow and blur.
- Glass layer: `backdrop-filter: blur(18px)` for overlays.
- Avoid heavy drop shadows in dense lists.

### 3.5 Motion
- Page enter: 160ms fade + 6px translate.
- List updates: 120ms crossfade.
- Toasts: 200ms slide up.
- Avoid micro-motions on every click to keep speed.

### 3.6 Iconography
Rounded, single-stroke 1.5px icons, consistent grid.
Categories: action, status, navigation, entity-type.

## 4. Component System

Core components:
- `CommandPalette`
- `SmartTab`
- `ContextRail`
- `ActionDock` (floating actions for touch)
- `KPIChip`
- `OrderCard`
- `TicketStack` (KDS)
- `DenseTable` (virtualized)
- `FieldGroup` (forms)
- `AuditTimeline`
- `PriceBreakdown`
- `StatusPill`
- `PrinterBadge`

Behavior rules:
- All tables virtualized for large datasets.
- `ActionDock` replaces inline buttons on POS touch.
- `StatusPill` colors are semantic, not brand.
- `FieldGroup` reduces form noise by grouping per task.

## 5. Layout Examples (Major Pages)

### 5.1 POS Screen
Goal: two-tap speed, low cognitive load.
Layout:
- Left: Order builder with item list, modifiers, notes.
- Center: Menu grid with smart categories and search.
- Right: Payment panel with split, discount, and receipt preview.

UX improvements:
- Sticky totals and quick modifiers.
- Split bill in one step with drag to split.
- Manager approval inline with a compact approval drawer.

### 5.2 Orders Management
Layout:
- Top: Filters, time range, status, channel.
- Main: Order list with status progression, SLA.
- Side: Selected order detail with actions.

UX improvements:
- Multi-select actions for bulk status updates.
- SLA heatmap in list header.

### 5.3 Menu & Items
Layout:
- Left: Category list.
- Main: Item cards with stock, price, modifiers.
- Right: Detail panel for editing.

UX improvements:
- Inline bulk edits.
- Modifier templates and reuse.

### 5.4 Tables Management
Layout:
- Main canvas: floor map with table chips.
- Right panel: table status, reservation, server assignment.

UX improvements:
- Drag to assign server.
- Color-coded table states with numeric status badges.

### 5.5 Inventory
Layout:
- Top: Critical stock alerts.
- Main: Dense table with filters.
- Right: Stock movement timeline.

UX improvements:
- Quick adjust modal with reason presets.
- Supplier view for reorder planning.

### 5.6 Kitchen Display (KDS)
Layout:
- Columns by station with ticket stacks.
- Large tap targets for start, ready, complete.

UX improvements:
- SLA timer ring around each ticket.
- Audible and visual alert on priority items.

### 5.7 Reports & Analytics
Layout:
- Top: KPI row with comparisons.
- Main: Graphs and breakdown table.
- Right: Insight panel with anomalies.

UX improvements:
- Quick export and share.
- Saved report views.

### 5.8 Staff Management
Layout:
- Main: staff list with role chips.
- Right: schedule and permissions panel.

UX improvements:
- Permission diff view for roles.
- Audit trail per staff action.

### 5.9 Settings
Layout:
- Settings groups in collapsible panels.
- Search at top with quick jump.

UX improvements:
- Change impact summary before save.
- Required approvals inline.

### 5.10 Dashboard
Layout:
- Modular cards: sales, top items, labor, refunds.
- Drag and resize grid.

UX improvements:
- Focus presets for each role.
- KPI drill-down without page change.

## 6. UX Improvements Summary
- Command-first navigation reduces clicks.
- Contextual actions appear where the user works.
- Dense information for managers, simplified for POS.
- Reduced modal usage; drawers preferred.
- Touch-first spacing and controls for POS/kitchen.
- Persistent working state across modules.

## 7. Design Principles Used
- Speed over decoration.
- Clarity over density.
- Context over global chrome.
- Learnability with consistent patterns.
- Touch-friendly by default.
- Motion as feedback, not distraction.

## 8. Responsive Strategy
Breakpoints:
- POS touch: 1024x768
- Tablet: 768-1024
- Desktop: 1280+
- Mobile: 360-480

Rules:
- ActionDock visible on tablet/POS.
- ContextRail collapses to floating pill on touch.
- SmartTabs show max 3 items on mobile, overflow into palette.

