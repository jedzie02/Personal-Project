# DinkSync Logo (Option A: Paddle + Dink Arc) — Short Design Spec

## Intent & Why
Replace the generic `CircleDotDashed` Lucide icon and default Next.js favicon with the bespoke **DinkSync Option A ("Paddle + Dink Arc")** emblem across the customer navbar, admin sidebar, auth pages, and browser tab icon (`src/app/icon.svg`).

## Goals, Non-Goals, Anti-Goals
- **Goals:** Create a reusable `<DinkSyncLogo />` component (`src/components/DinkSyncLogo.tsx`) and a matching `src/app/icon.svg` browser tab icon, and wire `<DinkSyncLogo />` into `Navbar.tsx`, `Sidebar.tsx`, `auth/login/page.tsx`, `auth/signup/page.tsx`, and `login/page.tsx`.
- **Non-Goals:** Changing page layouts or navigation links.
- **Anti-Goals:** Raster images that blur on retina displays — use crisp inline SVG everywhere.

## Approaches Considered
1. **Option A — Paddle + Dink Arc (Selected):** Angled white pickleball paddle, emerald sync trajectory arc, and gold 3-hole pickleball inside a royal-blue rounded-square badge (`#2563eb` -> `#1d4ed8`), plus two-tone `Dink` + blue `Sync` wordmark.
2. **Option B — Kitchen Grid + Live Ball:** Court lines + central ball.
3. **Option C — Synced Pickleball Orbit:** 5-hole pickleball with dual orbit arcs.
4. **Option D — Monogram "D" + 4-Hole Diamond:** Geometric "D" lettermark.

## Files to Create / Update
- Create: `src/components/DinkSyncLogo.tsx`
- Create: `src/app/icon.svg` (and remove old `src/app/favicon.ico` so Next.js serves the crisp SVG icon)
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/admin/Sidebar.tsx`
- Modify: `src/app/auth/login/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`
- Modify: `src/app/login/page.tsx`

