# Open Play Sessions Design

## 1. Intent & Why
Paddlix only sells a whole court by the hour (₱300/hr). Open play lets the venue run scheduled sessions that individual players (solo or pairs) join and pay for per head. This brings in beginners and players without a group, fills court hours that would otherwise sit empty, and backs the "Open Play" promise already shown on the landing page ("Why players choose Paddlix").

## 2. Goals, Non-Goals, Anti-Goals
- **Goals**
  - Admin creates an open play session: court, date, start/end time (whole hours), price per player, player cap.
  - A session blocks its court time on the booking grid so nobody can book that court as a private court.
  - Logged-in players see upcoming sessions on the landing page with spots left (e.g. "5/8 joined"), tap Join, pay online by card (Stripe), and the paid join reserves their spot.
  - A paid join sends the same Gmail receipt style as court bookings, and shows in the player's "My Bookings" area and a confirmation page.
  - A full session shows "Full" and cannot be joined, even under simultaneous joins.
  - Admin can see who joined each session and cancel a session.
- **Non-Goals (this version)**
  - Player-hosted sessions, skill levels, waitlists, recurring/repeating sessions, automatic refunds, GCash QR joins, joining more than one spot per player per session.
- **Anti-Goals**
  - Breaking or changing existing court booking, payment, or receipt behavior.
  - Overbooking a session past its cap.
  - Charging a player without reserving a spot, or reserving a spot without payment.

## 3. Constraints
- Do not alter the existing `bookings` or `payments` tables' columns or constraints (user's choice: Approach 1 keeps live tables untouched). The only interaction with `bookings` is inserting one hold row per session.
- Current state: `payments` and the receipt flow are keyed on `booking_id`; the booking grid decides what is taken from `bookings` (statuses `pending`, `confirmed`, `completed`); Stripe card checkout already exists (`createCheckoutSession`, currency `"php"`, amounts in centavos); Gmail receipts are sent from `src/lib/services/email.service.ts`; schema changes are delivered as SQL files in `supabase/migrations/` that the owner runs manually in Supabase.
- Stack: Next.js (App Router, server actions), Supabase, Stripe, Tailwind; follow `DESIGN.md` ("Court Command" palette, ₱ glyph, 12-hour AM/PM times, `text-xs` minimum, light and dark mode).
- Venue hours are 9 AM–11 PM; sessions must fall inside them and use whole hours.
- Times and "today" use Philippine time (`getManilaNow`).

## 4. Approaches
1. **Separate open-play tables with their own payment records (chosen).** New `open_play_sessions` and `open_play_entries` tables, one hold booking per session to block the court, a Stripe checkout per join. Leaves live `bookings` and `payments` columns untouched. Trade-off: open-play money does not appear in the admin Payments ledger until a small combined view is added.
2. **Extend the existing `payments` table.** Make `booking_id` optional and add a join id so payments show in the current ledger. Rejected: needs a migration on a live table every booking payment depends on.
3. **Ruled out:** one booking row per joining player. The court-overlap check would block the second joiner, or the grid would show the court as booked once per player.

## 5. Decided Design
### Data (new migration `supabase/migrations/20261103_open_play.sql`)
- `open_play_sessions`: `id`, `court_id`, `session_date`, `start_time`, `end_time`, `price_per_player` (numeric), `player_cap` (int > 0), `status` (`scheduled` | `cancelled`), `hold_booking_id` (the booking row that blocks the court), `created_at`.
- `open_play_entries`: `id`, `session_id`, `customer_id`, `status` (`pending` | `paid` | `cancelled` | `needs_refund`), `amount`, `stripe_checkout_session_id`, `hold_expires_at`, `created_at`. One entry per (`session_id`, `customer_id`) (unique); abandoned entries are reused on re-join.
- Spots left = `player_cap` − count of entries with status `paid`, plus `pending` entries whose `hold_expires_at` is still in the future.
- Cap enforcement lives in the database, not the page: a Postgres function claims a spot in one atomic step, so two simultaneous joiners cannot both take the last spot.

### Reserving the court (my call)
- Creating a session inserts one hold booking for the court and time (status `confirmed`, owned by the admin's profile, payment method "Open Play hold", price 0) so the existing grid shows the slot as booked and the existing overlap check rejects private bookings. Session creation fails if that court time already has a booking. Cancelling a session also cancels its hold booking.
- The live `bookings` schema was not inspected for constraints on `payment_method` or `total_price`. The builder's first step is to confirm the hold insert is accepted; if a constraint rejects it, stop and ask the owner instead of altering `bookings`.
- Hold rows must not distort existing views: revenue figures, the admin bookings list, the player's My Bookings, and any reminder emails exclude bookings whose payment method is "Open Play hold" (read-side filter only, no schema change).

### Player flow
- Landing page gets an "Open Play" section listing upcoming scheduled sessions (today onward, not past): date, time, court, price per player, spots left, and a Join button. Logged-out players are sent to login and returned.
- Join claims a pending spot and starts a Stripe card checkout for `price_per_player`. The pending spot is held for 30 minutes and the Stripe Checkout session is created with `expires_at` set to the same 30 minutes (Stripe's minimum), so a player cannot pay after losing the spot. (My call.) If the player abandons checkout, the spot is released when the hold expires.
- Re-joining after an expired or abandoned pending entry reuses that row (reset to `pending`, new hold) rather than adding a second row. Players cannot cancel their own entry in this version. (My call.)
- Marking paid works the same way court bookings do today: the Stripe webhook (`src/app/api/stripe/webhook/route.ts`) and the redirect-time sync on the confirmation page both call one idempotent "mark entry paid" function. The receipt email is sent only on the first transition to `paid`, so duplicate calls never send duplicate emails.
- Late or cancelled-session payments: if a payment arrives for an entry whose session is `cancelled`, or whose hold expired and the spot was taken, the entry becomes `needs_refund` instead of `paid` — no spot, no receipt — and appears in the admin list flagged for a manual Stripe refund. This keeps the anti-goal "never charge without reserving" as close to true as possible; the money is flagged, not silently kept. (My call.)
- Confirmation page for a paid join, and the join appears in the player's My Bookings area.

### Admin flow
- New admin page "Open Play": create session form, list of sessions with joined count, per-session list of players, and Cancel session.
- Cancelling a session marks it `cancelled`, marks its `paid` entries `cancelled` (flagged as needing a manual refund), marks its `pending` entries `cancelled`, and cancels the hold booking. Any later payment on those entries goes to `needs_refund` as above. Refunds are done manually in Stripe in this version; the admin page lists every entry that needs one.
- Sessions cannot be edited after creation in this version (cancel and recreate instead). An admin may cancel any upcoming scheduled session, with or without entries; past sessions cannot be cancelled. (My call.)

### Payments and receipts (my call)
- Card (Stripe) only for open play at launch, because Stripe confirms payment automatically; GCash QR needs manual admin verification and is left for a later version.
- Receipt email reuses the existing Gmail sender with open-play wording (session date, time, court, amount).

## 6. Left to the Builder
- Exact layout and copy of the landing Open Play section and admin page (follow `DESIGN.md`), the cron/expiry mechanism for pending spots, how the combined admin ledger view is added later, and test structure.

