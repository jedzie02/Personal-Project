# Customer Tier Labels Redesign

## Intent & Why
The current customer tier labels in the admin dashboard (`src/app/admin/customers/page.tsx` and `src/app/admin/customers/[id]/page.tsx`) use `"VIP Member"`, `"Regular Member"`, and `"Guest"`. Using "Guest" is inaccurate because every person listed in this table is an authenticated, registered customer with an account. Additionally, using "Member" can confuse staff into assuming customers have a paid recurring subscription or club membership, when the tier is actually an indicator of court booking frequency.

## Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Update the dynamic customer tier labeling across customer management pages to:
    - **VIP Player** (20+ bookings)
    - **Regular Player** (5 to 19 bookings)
    - **New Player** (0 to 4 bookings)
  - Update the customer dashboard summary metric cards:
    - "VIP Players"
    - "Regular Players"
    - "New Players"
  - Update the customer detail page tier badges and descriptions in `src/app/admin/customers/[id]/page.tsx`.
- **Non-Goals:**
  - Changing booking count threshold logic (`20` for VIP, `5` for Regular, `< 5` for New).
  - Altering Supabase schemas, tables, or database fields.
- **Anti-Goals:**
  - Leaving inconsistent naming between the customer list and customer detail screens.
  - Breaking customer search or table layout.

## Constraints
- Next.js 16 Server Components in `src/app/admin/customers/page.tsx` and `src/app/admin/customers/[id]/page.tsx`.
- Tailwind CSS styling matching existing dark/light badges.
- Ponytail minimalism: straightforward string and label refactoring with zero architectural overhead.

## Approaches Considered
1. **Activity-Based Player Tiers (Selected):**
   - VIP Player, Regular Player, New Player.
   - *Tradeoffs:* Accurately reflects registered status and booking frequency without implying paid club subscriptions.
2. **Sport / Community Themed Tiers:**
   - Champion, Dinker, Starter.
   - *Tradeoffs:* High sport flavor, but less formal for admin auditing.
3. **Prestige Metal Tiers:**
   - Gold, Silver, Bronze.
   - *Tradeoffs:* Universal, but feels like an airline loyalty program.

*Selection:* The user selected **Approach 1 (Activity-Based Player Tiers)**.

## The Decided "How"
1. **In `src/app/admin/customers/page.tsx`:**
   - Update `getMembershipTier(count)`:
     - `>= 20`: `{ label: "VIP Player", cls: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" }`
     - `>= 5`: `{ label: "Regular Player", cls: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" }`
     - `< 5`: `{ label: "New Player", cls: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" }`
   - In the summary cards:
     - Change `"VIP Members"` to `"VIP Players"`.
     - Change `"Regular Members"` to `"Regular Players"`.
     - Change `"Guests"` to `"New Players"`.
2. **In `src/app/admin/customers/[id]/page.tsx`:**
   - In the Membership Tier card:
     - Display: `bookings.length >= 20 ? "VIP Player" : bookings.length >= 5 ? "Regular Player" : "New Player"`.
     - Description: `bookings.length >= 20 ? "Top frequent player" : bookings.length >= 5 ? "Active returning player" : "First-time or occasional player"`.

## What's Left to the Builder
- Implementing the label updates across both files.
- Adding unit/integration test coverage verifying tier label rendering and summary count titles.
- Verifying tests and build succeed.

