# Minimalist Monochrome & Court Lime Design System Spec

**Date:** 2026-11-02  
**Status:** In Review  
**Author:** Pair Programming Session  

---

## 1. Intent and the Why
The current Paddlix pickleball platform uses a fragmented palette with saturated blues (`blue-600`), slates, emeralds, and ambers across customer booking and admin panels. This creates visual noise and feels like a generic template rather than a premium, modern sports platform.

The goal is to transform the entire platform into a unified **minimalist monochrome system** with a signature **court lime accent** (`#84CC16` / chartreuse) and a **softer dark mode** (`zinc-900`/`zinc-950`). This provides clarity, elevated contrast, and an athletic personality inspired by modern software aesthetics (Vercel, Linear).

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Single Source of Truth**: Centralize theme variables in `src/app/globals.css` using semantic CSS tokens (`--background`, `--foreground`, `--primary`, `--border`, `--muted`, `--accent-court`).
- **Modern Monochrome Aesthetic**: 
  - Light mode: Clean white (`#FFFFFF`) / off-white (`zinc-50`) backgrounds with subtle hairline borders (`zinc-200`) and solid black primary actions.
  - Dark mode: Softer dark charcoal (`zinc-950` / `#09090B` canvas with `zinc-900` / `#18181B` cards and `zinc-800` borders) rather than harsh OLED pitch black.
- **Selective Athletic Accent**: The pickleball ball lime accent (`#84CC16` / `#A3E635`) is used with restraint: strictly for active/selected slot indicators, live status pills, and verified checkmarks.
- **End-to-End Cohesion**: Customer booking grid, floating cart bar, confirmation flow, receipts, navbar, and admin schedule/dashboard all share the exact same token language.

### Non-Goals
- Changing layout structure, booking algorithms, or business logic.
- Adding complex runtime theme switchers beyond the existing light/dark mode support.
- Altering existing data schemas or API contracts.

### Anti-Goals
- Neon clutter: The court lime color must NOT become a dominant background color for full-page banners or large buttons; it is strictly an accent dot/badge.
- Unreadable low-contrast gray text: Contrast ratios must strictly comply with WCAG AA standards (minimum 4.5:1 for body copy).

---

## 3. Constraints
- **Tailwind CSS v4 & Next.js 16 (App Router)**: Changes must adhere to Tailwind v4 `@theme inline` conventions in `src/app/globals.css`.
- **Operating Rules**: Keep all functionality intact (₱300/hr pricing, 09:00–23:00 operating hours, multi-court cart selection).
- **Verification**: Zero TypeScript errors (`npx tsc --noEmit`) and all unit tests passing (`npm run test`).

---

## 4. Approaches Considered

### Approach 1: Design Tokens First (Selected)
Define semantic CSS variables in `src/app/globals.css` and map them through Tailwind theme utilities (`bg-background`, `bg-card`, `bg-primary`, `border-border`, `text-primary`, `bg-accent-court`). Refactor component instances across customer and admin pages to reference these tokens.
- **Pros**: Centralized control; changing colors later takes seconds in a single file; prevents color fragmentation.
- **Trade-offs**: Requires refactoring color classes across ~15 files.
- **Why chosen**: Approved by the user for long-term maintainability and design consistency.

### Approach 2: Direct In-Place Utility Replacement
Manually replace color classes (`blue-600` to `zinc-900`, `slate-900` to `zinc-900`) file-by-file without touching `globals.css` tokens.
- **Pros**: Localized edits per file.
- **Trade-offs**: Hardcodes colors across many files; prone to drift and inconsistency over time.
- **Status**: Rejected.

---

## 5. Visual Palette & Token Specifications

### 5.1 Color Tokens

| Token | Light Mode Value | Dark Mode Value (Softer Dark) | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` (`#FFFFFF`) | `oklch(0.18 0.005 285)` (`#121214` / zinc-950) | Main page canvas |
| `--card` | `oklch(0.985 0 0)` (`#FAFAFA`) | `oklch(0.22 0.005 285)` (`#18181B` / zinc-900) | Cards, grid rows, modals |
| `--foreground` | `oklch(0.145 0 0)` (`#09090B`) | `oklch(0.985 0 0)` (`#FAFAFA`) | Headings, primary text |
| `--muted` | `oklch(0.96 0 0)` (`#F4F4F5`) | `oklch(0.27 0.005 285)` (`#27272A` / zinc-800) | Secondary surfaces, passed slots |
| `--muted-foreground` | `oklch(0.55 0 0)` (`#71717A`) | `oklch(0.65 0 0)` (`#A1A1AA`) | Helper text, slot times, labels |
| `--border` | `oklch(0.92 0 0)` (`#E4E4E7`) | `oklch(0.30 0.005 285)` (`#27272A` / zinc-800) | Card borders, grid cell dividers |
| `--primary` | `oklch(0.145 0 0)` (`#09090B`) | `oklch(0.985 0 0)` (`#FAFAFA`) | Primary action buttons, selected pills |
| `--primary-foreground` | `oklch(0.985 0 0)` (`#FAFAFA`) | `oklch(0.145 0 0)` (`#09090B`) | Text on primary buttons |
| `--accent-court` | `#84CC16` (Lime 500) | `#A3E635` (Lime 400) | Court active dot, selected pill dot, checkmarks |

### 5.2 Key Component Transformations
1. **Booking Grid (`BookingGrid.tsx`)**:
   - Available cells: Neutral background (`bg-muted/40`), subtle border (`border-border`), dark text on hover.
   - Selected cells: High-contrast solid primary (`bg-primary text-primary-foreground`) with an electric lime indicator dot.
   - Booked/Passed cells: Subdued neutral gray (`bg-muted/60 text-muted-foreground`).
2. **Bottom Floating Cart Bar**:
   - Surface: Frosted glass monochrome (`bg-card/95 backdrop-blur-md border border-border`).
   - Slot Pills: Solid black in light mode, solid white in dark mode, accompanied by lime dot and subtle remove icon.
   - Review & Book CTA: Solid primary button.
3. **Confirm Booking & Receipt (`ConfirmBookingClient.tsx`, `confirmation/page.tsx`)**:
   - Replace blue summary cards and alert banners with clean zinc bordered cards.
   - GCash Reference & verified checkmark badge: Lime / neutral badge.
4. **Navbar & Navigation (`Navbar.tsx`)**:
   - Clean zinc border bottom, monochrome branding and action buttons.
5. **Admin Portal (`ScheduleTimeline.tsx`, `Sidebar.tsx`, `bookingstable.tsx`)**:
   - Sidebar: Dark zinc surface (`zinc-900`) with high-contrast active states.
   - Timeline: Clean monochrome court columns with lime markers for active live hours.

---

## 6. What's Left to the Builder
- Precise OKLCH / hex variable fine-tuning in `globals.css` ensuring crisp contrast across dark and light themes.
- Exact transitional animation utility classes for slot selection.

