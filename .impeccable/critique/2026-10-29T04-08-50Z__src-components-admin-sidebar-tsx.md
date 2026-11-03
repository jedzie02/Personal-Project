---
target: src/components/admin/Sidebar.tsx
total_score: 16
max_score: 36
na_heuristics: 9
p0_count: 1
p1_count: 1
target_identity: "file:C:\\Users\\jedrik\\Projects\\pickle-wb\\src\\components\\admin\\Sidebar.tsx"
target_fingerprint: "sha256:84a1b49c461ed9d97b70022bdfa5851a22bcc01f1e7719df4ea77eacdf7c420a"
target_path: "C:\\Users\\jedrik\\Projects\\pickle-wb\\src\\components\\admin\\Sidebar.tsx"
timestamp: 2026-10-29T04-08-50Z
slug: src-components-admin-sidebar-tsx
closed: true
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 1 | Active state wash has 1.08:1 contrast; zero ambient facility status (court occupancy, pending count) |
| 2 | Match System / Real World | 2 | Generic SaaS tiers (MAIN, MANAGEMENT, FINANCE) ignore venue workflow; CreditCard icon mismatches PH cash/GCash reality |
| 3 | User Control and Freedom | 2 | Mobile drawer lacks Escape key listener and body scroll lock; no quick link to customer booking grid |
| 4 | Consistency and Standards | 2 | `layout.tsx` flex-row breaks mobile top bar; missing `aria-current="page"`; mobile bar lacks dark mode classes |
| 5 | Error Prevention | 1 | Immediate, unconfirmed session destruction on single-click `Log out` right below nav |
| 6 | Recognition Rather Than Recall | 3 | Clean icon/label pairing; lack of notification badges forces recall of pending work |
| 7 | Flexibility and Efficiency | 1 | No quick-action "+ Walk-in Booking", no search/shortcuts, 36px sub-touch targets |
| 8 | Aesthetic and Minimalist Design | 3 | Athletic hairline borders; diluted by an orphaned `FINANCE` category with a single item |
| 9 | Error Recovery | n/a | Navigation chrome only (no forms or error boundaries) |
| 10 | Help and Documentation | 1 | Zero shortcuts legend or front-desk help link |
| **Total** | | **16/36** | **Poor / Needs Work** |

## Design Specificity Verdict

The admin sidebar currently acts as generic administrative boilerplate rather than a tailored court operations console. Paddlix is a high-turnover sports facility (4 master courts, 9:00 AM – 12:00 AM daily in Metro Manila) where front desk operators handle phone calls, walk-in players, and GCash payments under time pressure. The current sidebar lacks venue context (which facility/shift is active), lacks an ambient court occupancy indicator, and lacks an immediate "+ Walk-in" action.

**Deterministic scan**:
`.agent/skills/impeccable/scripts/impeccable detect` returned 0 static token violations across `src/components/admin/Sidebar.tsx` and `src/app/admin/layout.tsx`. The code respects Tailwind scale values (`text-xs`, `text-sm`, `size-5`, `rounded-lg`). However, the deterministic scanner missed critical semantic and behavioral flaws: absent `aria-current="page"`, missing mobile dialog accessibility attributes, dark mode omission on the mobile header, and the critical `flex-row` parent bug in `layout.tsx`.

**Visual overlays**:
Skipped. Dev server is inactive and `src/app/admin/layout.tsx` enforces server-side authentication redirect.

## Overall Impression

The sidebar delivers a tidy baseline, but it suffers from a critical mobile layout bug in `layout.tsx`, an unshielded session-killer logout button, sub-44px touch targets, and generic SaaS taxonomy that ignores real-world pickleball facility operations.

## What's Working

1. **Robust Active Path Matching**: `pathname === item.url || pathname.startsWith(`${item.url}/`)` ensures deep sub-routes (e.g. `/admin/bookings/new` or `/admin/courts/[id]`) maintain correct active parent lighting.
2. **Brand Symbol Alignment**: The `CircleDotDashed` icon container cleanly evokes a perforated pickleball while adhering to the flat athletic aesthetic.
3. **Clean Component Architecture**: Hoisted `navSections` array outside render loop, smooth drawer transitions, and clean hover micro-interactions.

## Priority Issues

### [P0] Mobile Top Bar Layout Broken by Parent `flex-row` in `layout.tsx`
- **What**: The outer wrapper in `src/app/admin/layout.tsx` is `<div className="flex min-h-screen w-full ...">` without `flex-col`. The mobile top bar `<div className="md:hidden ...">` renders as an inline sibling to the main content wrapper.
- **Why it matters**: On mobile viewports, the top bar is horizontally crushed into the left side of the screen, breaking header layout and causing page content to overlap.
- **Fix**: Update `src/app/admin/layout.tsx` root container to `flex flex-col md:flex-row`.
- **Suggested command**: `/impeccable polish`

### [P1] Instant Unconfirmed Session Destruction on Bottom Logout
- **What**: The prominent red `Log out` button immediately signs out of Supabase and clears auth storage on a single tap with zero confirmation.
- **Why it matters**: A busy operator tapping near the bottom of an iPad or mobile screen can accidentally destroy their active shift session mid-booking.
- **Fix**: Add a confirmation dialog or tuck logout inside an operator profile popover.
- **Suggested command**: `/impeccable harden`

### [P2] Missing A11y Semantics & Mobile Dialog Hardening
- **What**: Nav items lack `aria-current={isActive ? "page" : undefined}`. The mobile drawer lacks `role="dialog"`, `aria-modal="true"`, focus trap, Escape key listener, and `overflow-hidden` body scroll lock.
- **Why it matters**: Screen readers cannot announce the active route, and mobile users experience background scroll bleed and trapped focus.
- **Fix**: Add `aria-current`, hook up an Escape key listener, lock body scroll when `open` is true, and harmonize dark mode classes on the mobile top bar.
- **Suggested command**: `/impeccable harden`

### [P2] Generic SaaS Taxonomy Lacks Facility Ergonomics & Walk-in CTA
- **What**: Navigation is fractured across 3 enterprise categories (`MAIN`, `MANAGEMENT`, `FINANCE`) for just 6 items. There is no "+ Walk-in Booking" quick action, no live court occupancy indicator, and no link to view the player booking grid.
- **Why it matters**: Front desk operators handling fast walk-ins are forced through multi-step navigation paths.
- **Fix**: Streamline into operational groupings (e.g., `OPERATIONS`, `FINANCIALS`), add a high-visibility `+ Walk-in` CTA, and surface facility status.
- **Suggested command**: `/impeccable shape`

### [P3] Low-Contrast Active State & Sub-44px Touch Targets
- **What**: `bg-emerald-50` against `#ffffff` yields a 1.08:1 contrast ratio. Nav links have a 36px click target height (`py-2` + 20px icon).
- **Why it matters**: Active navigation is virtually invisible under venue lighting glare, and 36px targets cause frequent mis-taps on touch devices.
- **Fix**: Add a prominent left emerald accent strip (`border-l-4 border-emerald-600` or indicator pill per `DESIGN.md`) and increase touch target height to at least 44px (`py-2.5`).
- **Suggested command**: `/impeccable polish`

## Persona Red Flags

- **Maria (Front Desk Operator under Peak Rush)**: At 6:30 PM with players at the counter, Maria tries to book a walk-in court from an iPad. The 36px links cause her to tap "Courts" instead of "Bookings". While reaching for the bottom of the screen, her palm grazes the red "Log out" button, instantly killing her session with no confirmation.
- **David (Facility Owner Reviewing Nightly Closeout on Mobile)**: David checks revenue from mobile Safari. The mobile header is crushed into the left margin due to the `flex-row` parent bug. When he opens the drawer, background content scrolls underneath, and the stark white mobile bar flashes against his dark mode system setting.

## Minor Observations

- `CreditCard` icon assumes Western credit card dominance, whereas Philippine venue payments are predominantly GCash QR and cash (`Wallet` or `Receipt` fits better).
- `src/components/ui/admin/app-sidebar.tsx` exists as an unnecessary re-export.
- `handleLogout` manually clears individual localStorage keys instead of a unified auth store reset.

## Questions to Consider

1. *Should the admin sidebar feature a persistent, high-contrast "+ Walk-in" CTA at the top so desk staff can immediately start a reservation from any screen?*
2. *Would consolidating the 3 enterprise categories into two operational groups ("OPERATIONS" and "FINANCE") with counter badges (e.g., pending payments/bookings) reduce cognitive friction?*
3. *Should operator identity (name, role, avatar) and logout be consolidated into a bottom profile card matching the customer navbar pattern?*
