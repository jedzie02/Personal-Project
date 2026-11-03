# Live Hero & 1-Tap Prime Slot Strip Design

## 1. Intent & Why
Turn Paddlix's text-only landing hero (`src/app/page.tsx`) into a live, conversion-focused court command strip so visiting players immediately see real-time availability, understand how affordable a court is when split among 4 doubles players (`₱75/player/hr`), and can grab an upcoming prime slot in one tap.

## 2. Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Show a live status pill in the hero with the total open 1-hour slots remaining today (or tomorrow when today's hours have ended) plus the 4-player doubles split (`₱300/hr · ₱75/player`).
  - Render up to 3 upcoming available slot cards (`Next Up`, `Prime Time` for 5:00 PM–9:00 PM, or `Only 1 Court Left!` when only 1 court remains open at that hour).
  - Tapping a quick-slot card smoothly scrolls to `#book-a-court` and auto-selects that slot in `BookingGrid`'s cart (opening the floating cart bar, which also displays the 4-player per-person split).
- **Non-Goals:**
  - Changing the checkout or payment backend (`confirm-booking`, Stripe, or GCash flows remain untouched).
- **Anti-Goals:**
  - Forcing a dark-only card in light mode or adding decorative marketing bloat that violates `DESIGN.md`'s "Court Command" athletic pragmatism.

## 3. Constraints
- Must follow `DESIGN.md` tokens: Matchpoint Blue (`#2563eb`), Court Turf Emerald (`#059669`), Caution Amber (`#f59e0b`), `tabular-nums` for all rates/times, 12-hour AM/PM formatting, and full light/dark theme parity.
- Must keep `src/app/page.tsx` as a Next.js Server Component with zero additional database round-trips when today's slots are open (only fetching tomorrow's grid if today has 0 open slots left).

## 4. Approaches Considered
1. **Approach 1 (Selected): Instant Client Event + Pure Slot Finder Helper**
   - Compute open slot counts and the top 3 quick-pick slots via a pure helper (`src/lib/utils/quick-slots.ts`). Render `HeroQuickSlots` in the hero; clicking a same-day slot dispatches a `paddlix:select-slot` browser event that `BookingGrid` listens for to select the slot and scroll to `#book-a-court` without a server reload. If today is closed/full and the hero shows tomorrow's slots, fallback to `/?date=TOMORROW&selectCourt=...&selectHour=...#book-a-court`.
2. **Approach 2: URL Query Parameters Only**
   - Every click navigates via `?date=...&selectCourt=...&selectHour=...`. Rejected because same-day clicks would trigger an unnecessary route navigation and server re-render.

## 5. Decided Behavior
- **Quick-Slot Selection (`User Selected`):** Tapping a quick-slot card in the hero scrolls down to `#book-a-court` and auto-selects that court + hour in the booking grid cart so the customer can either tap **Review & Book** immediately or tap a second hour to extend their game.
- **Urgency & Split Copy (`Proposed & Accepted`):**
  - Hero status badge shows live open slot count + `₱300/hr (₱75/player for 4)`.
  - Up to 3 quick-slot cards show formatted 12-hour time (`06:00 PM – 07:00 PM`), court name, rate (`₱300/hr`), and contextual status badge (`Next Available`, `Prime Time`, or `Only 1 Court Left!`).
  - Floating cart bar in `BookingGrid.tsx` also shows a subtle `₱XX/player (4 players)` helper beside the total price.

## 6. Left to the Builder
- Exact card spacing, responsive 1-column mobile / 3-column desktop grid layout for the 3 quick-slot cards, and unit tests for `src/lib/utils/quick-slots.ts`.

