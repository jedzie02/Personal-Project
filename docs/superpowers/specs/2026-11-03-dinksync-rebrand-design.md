# DinkSync Platform Rebrand — Short Design Spec

## Intent & Why
Rebrand the pickleball court booking & Open Play platform from **Paddlix** to **DinkSync** so the product has a commercial, pickleball-native software brand suitable for selling to court and club owners.

## Goals, Non-Goals, Anti-Goals
- **Goals:** Replace user-facing brand text (`Paddlix` -> `DinkSync`, `play@paddlix.com` -> `play@dinksync.com`, `paddlix-payments-*.csv` -> `dinksync-payments-*.csv`) across metadata, navbar, landing page, auth pages, legal/about pages, admin sidebar/schedule/payments, and Gmail receipts (`email.service.ts`).
- **Non-Goals:** Changing database table/column names, layout, colors, or booking logic.
- **Anti-Goals:** Breaking existing client storage keys or custom DOM event names if not updated in lockstep.

## Constraints
- Preserve all existing routes, dark/light styling, and unit tests (`41/41` passing).

## Approaches Considered
1. **Full UI, Metadata, Admin & Receipt Rebrand to `DinkSync` (Selected):** Update all 12 user-facing and email files from `Paddlix` to `DinkSync` (`play@dinksync.com`).
2. **Co-branded "Powered by DinkSync":** Keep venue name separate from software name; deferred until multi-tenant venue configuration is needed.

## Files to Update
- `src/app/layout.tsx`
- `src/components/Navbar.tsx`
- `src/app/page.tsx`
- `src/app/about/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/login/page.tsx`
- `src/components/admin/Sidebar.tsx`
- `src/components/admin/ScheduleTimeline.tsx`
- `src/app/admin/payments/PaymentsLedger.tsx`
- `src/lib/services/email.service.ts`

