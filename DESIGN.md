---
name: Paddlix
description: Real-time pickleball court booking and venue operations platform
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-subtle: "#eff6ff"
  operational-success: "#059669"
  operational-success-subtle: "#ecfdf5"
  operational-warning: "#f59e0b"
  operational-warning-subtle: "#fef3c7"
  destructive: "#dc2626"
  neutral-bg: "#ffffff"
  neutral-subtle-bg: "#f8fafc"
  neutral-surface: "#f1f5f9"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-text-muted: "#64748b"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  badge-available:
    backgroundColor: "{colors.operational-success-subtle}"
    textColor: "{colors.operational-success}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-maintenance:
    backgroundColor: "{colors.operational-warning-subtle}"
    textColor: "{colors.operational-warning}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  card-surface:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Paddlix

## Overview

**Creative North Star: "Court Command"**

Paddlix balances athletic utility with crisp administrative precision. Drawing inspiration from live stadium scheduling, timing displays, and modern facility operations, the interface eliminates cognitive friction and decorative fluff. Every surface is engineered for immediate scanability: players can review hourly slot availability, inspect rates in Philippine Pesos (₱), and confirm reservations in seconds, while venue managers command court statuses, rate schedules, and customer ledgers with dense, tabular clarity.

The aesthetic philosophy centers on **Athletic Pragmatism**: dependable monochrome foundations, high-contrast typography, and tactical bursts of functional color. Pure white canvases, subtle slate backdrops, and hairline borders organize dense reservation data without crowding the eye.

**Key Characteristics:**
- **Tactical Color Restraint:** Cobalt action accents are reserved strictly for high-intent customer progression, while emerald, amber, and slate provide unambiguous operational court status cues.
- **Tonal Layering at Rest:** Surfaces remain calm and flat by default; depth and shadows emerge intentionally to signal interactive states and active selections.
- **Crisp Form Language:** Tactile pill-shaped interactive triggers juxtaposed against cleanly rounded structural cards and tabular grids.
- **Transparent Metric Hierarchy:** Currency symbols (₱), hourly rates, and time slots enjoy top-level legibility across indoor and outdoor display lighting.

## Colors

A high-contrast, functional palette built on structured neutrals with dedicated customer-action and operational-status roles.

### Primary
- **Matchpoint Blue** (`#2563eb` / `oklch(0.55 0.22 255)`): Reserved exclusively for primary customer actions, booking triggers, active step navigation, and decisive confirmation modals.
- **Matchpoint Blue Deep** (`#1d4ed8`): Hover and pressed state for primary action buttons.
- **Matchpoint Blue Subtle** (`#eff6ff`): Subtle background tint for selected time slots and active customer badges.

### Secondary
- **Court Turf Emerald** (`#059669` / `oklch(0.60 0.16 155)`): The operational signal of open availability. Used for available court badges, active admin sidebar navigation, and successful reservation confirmations.
- **Court Turf Emerald Subtle** (`#ecfdf5`): Soft background wash for available court chips and active sidebar items.

### Tertiary
- **Caution Amber** (`#f59e0b` / `oklch(0.72 0.17 65)`): Warning and maintenance indicator. Applied to courts under maintenance, payment pending states, and schedule alerts.
- **Caution Amber Subtle** (`#fef3c7`): Background wash for maintenance warning pills.

### Neutral
- **Pure Court White** (`#ffffff`): Canonical background for cards, modals, booking grid containers, and surface elevation.
- **Soft Court Slate** (`#f8fafc`): Page canvas background providing soft contrast against pure white cards.
- **Hairline Border Slate** (`#e2e8f0`): The primary structural delimiter for grid lines, card perimeters, and table dividers.
- **Ink Slate** (`#0f172a`): High-contrast primary text color for headlines, court names, and hourly rates.
- **Subtle Gray Slate** (`#64748b`): Secondary label and metadata color for timestamps, descriptions, and auxiliary stats.
- **Destructive Crimson** (`#dc2626`): Cancellation, court deactivation, and booking removal triggers.

### Named Rules
**The Purposeful Accent Rule.** Primary Matchpoint Blue is reserved strictly for high-intent customer actions (booking, slot confirmation, primary buttons). Administrative, stateful, and status displays use contextual neutrals and status indicators to eliminate visual competition.

**The Court Status Triad Rule.** Court status is encoded only into Emerald (Available), Amber (Maintenance), and Muted Slate (Unavailable/Not Active). These semantic assignments are immutable throughout customer and admin surfaces.

## Typography

**Display Font:** Poppins (with sans-serif fallbacks)  
**Body Font:** Poppins (with sans-serif fallbacks)  
**Label/Mono Font:** Poppins (with monospace numerical tabular figures)  

**Character:** Geometric, active, and highly legible. Poppins delivers friendly geometric letterforms at headline scale while maintaining crisp, unmistakable numeral rendering for prices and timestamps.

### Hierarchy
- **Display** (800 weight, `clamp(2.25rem, 5vw, 3.75rem)`, 1.1 line-height): Hero landing headline and top-level brand statements.
- **Headline** (700 weight, `clamp(1.75rem, 3vw, 2.25rem)`, 1.2 line-height): Section titles ("Book a Court", "The fastest-growing sport in the world").
- **Title** (600 weight, `1.25rem` / 20px, 1.3 line-height): Court card titles, dialog titles, admin section headers.
- **Body** (400 weight, `0.9375rem` / 15px, 1.5 line-height): General descriptive copy, instructions, and user profile details.
- **Label** (600 weight, `0.75rem` / 12px, 1.2 line-height, uppercase tracking): Table headers, status badges, and timestamp column labels.

### Named Rules
**The Metric Legibility Rule.** Hourly rates and financial amounts must always present the Philippine Peso currency glyph (₱) at identical weight and size as the integer amount, avoiding currency decoupling.

## Layout

The spatial model relies on strict responsive container boundaries and an 8px modular spacing rhythm (`sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`).

- **Customer Landing & Booking:** Contained within a centered max-width envelope (`max-w-6xl` for the Booking Matrix, `max-w-5xl` for feature showcases, and `max-w-3xl` for the hero statement).
- **Admin Suite:** A two-pane shell featuring a fixed `w-64` sticky sidebar on the left and a flexible, scrollable workspace on the right (`flex-1 p-8`).
- **Booking Matrix Grid:** A responsive multi-court time grid with sticky hour columns and horizontal scrollability on compact viewports to preserve cross-court slot alignment.

## Elevation & Depth

Paddlix follows a tonal layering philosophy. Surfaces rest flat on the canvas bounded by crisp hairline borders (`border-slate-200`). Drop shadows are suppressed at rest and deploy purely as a response to interactive focus, hover states, and floating sheets.

### Shadow Vocabulary
- **Ambient Subtle** (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`): Applied to cards and court status pills at rest.
- **Interactive Lift** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)`): Applied during button hovers and hovered card tiles (`hover:-translate-y-0.5`).
- **Modal Overlay** (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15)`): Applied to booking confirmation dialogs and dropdown menus.

### Named Rules
**The Flat-At-Rest Rule.** Containers, booking cells, and dashboard cards rest flat on the canvas bounded by crisp hairline borders. Elevation shadows and micro-lift translations are reserved exclusively for interactive hover states and floating overlays.

## Shapes

- **Interactive Triggers & Badges:** Full pill geometry (`rounded-full` / 9999px) for primary CTA buttons, date chips, and court status badges.
- **Surface Containers & Cards:** Soft geometric rounding (`rounded-xl` / 14px to `rounded-2xl` / 18px) for booking containers, feature cards, and admin analytical widgets.
- **Controls & Input Fields:** Consistent medium radius (`rounded-lg` / 8px to 10px) for inputs, selects, dropdown menus, and table rows.

## Components

### Buttons
- **Shape:** Full pill (`rounded-full` / 9999px) for hero and customer actions; rounded rectangle (`rounded-lg` / 8px) for admin toolbar controls.
- **Primary:** Matchpoint Blue (`bg-blue-600`), white text, `px-6 py-3` or `px-12 py-7` for hero triggers.
- **Hover / Focus:** Lifts slightly (`hover:-translate-y-0.5`), shifts to `bg-blue-700` with subtle glow ring (`focus-visible:ring-3 focus-visible:ring-blue-300`).
- **Outline / Ghost:** Transparent background, `border border-slate-300` or `border-border`, transitions to `bg-slate-50` with slate text.

### Chips & Badges
- **Style:** Compact pill (`rounded-full px-3 py-1 text-xs font-semibold`).
- **Available:** Emerald text on emerald wash (`bg-emerald-50 text-emerald-800 border border-emerald-200`).
- **Maintenance:** Amber text on amber wash (`bg-amber-50 text-amber-800 border border-amber-200`).
- **Unavailable:** Slate text on neutral wash (`bg-slate-100 text-slate-600 border border-slate-200`).

### Cards / Containers
- **Corner Style:** Rounded (`rounded-xl` or `rounded-2xl`).
- **Background:** Pure Court White (`#ffffff`).
- **Border:** Hairline slate border (`border border-slate-200` or `border-gray-100`).
- **Internal Padding:** `p-6` to `p-8` for major containers; `p-4` for compact list items.

### Inputs / Fields
- **Style:** Clean white background, hairline border (`border-input` / `#e2e8f0`), rounded corners (`rounded-lg`).
- **Focus:** Sharp ring indicator (`ring-2 ring-blue-500 border-transparent`).
- **Disabled:** Dimmed opacity (`opacity-50 cursor-not-allowed bg-slate-50`).

### Navigation
- **Customer Navbar:** Clean white sticky header (`h-16`), backdrop blur (`backdrop-blur-md`), brand icon with CircleDotDashed mark, customer reservation sheet trigger, and initials avatar dropdown.
- **Admin Sidebar:** Fixed vertical navigation (`w-64`), crisp section categories (MAIN, MANAGEMENT, FINANCE), active emerald indicator pill, and bottom-anchored logout trigger.

### Signature Component: The Booking Matrix Grid
- **Structure:** Natural 4-court columns intersecting operating time slots (9:00 AM – 12:00 AM).
- **Cell States:** Available (white card with green status indicator and hourly rate), Booked (dimmed with locked icon), Maintenance (amber striped or dimmed), Selected (Matchpoint blue border and subtle glow).
- **Feedback:** Real-time modal preview displaying court name, formatted 12-hour time (AM/PM), calculated fee in ₱, and instant reservation lock.

## Do's and Don'ts

### Do:
- **Do** format all monetary amounts with the Philippine Peso glyph (`₱`) followed directly by the rate (e.g. `₱250/hr`).
- **Do** keep time slot displays in user-friendly 12-hour AM/PM format (e.g. `09:00 AM`, `10:00 PM`).
- **Do** preserve the semantic meaning of status colors: emerald for available, amber for maintenance, slate for inactive/past.
- **Do** pair icon glyphs with concise textual labels in administrative tables to maintain scanability.
- **Do** maintain hairline borders (`border-slate-200`) as the primary visual separation mechanism between matrix cells.

### Don't:
- **Don't** use Matchpoint Blue for informational or administrative statuses; reserve it for customer conversion actions.
- **Don't** introduce heavy dark shadows or exaggerated bevels that compromise the flat athletic utility aesthetic.
- **Don't** allow court rates or time slots to wrap onto multiple lines within grid cells.
- **Don't** use generic red/green indicator colors without accompanying border and background tonal washes.
