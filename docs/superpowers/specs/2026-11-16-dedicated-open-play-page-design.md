# Design: Dedicated Open Play Page (`/open-play`)

- **Date:** 2026-11-16
- **Scope:** Small change
- **Target Route:** `/open-play`

---

## 1. Intent & Why
Following the pattern established when court booking was moved from the landing page to `/book`, Open Play sessions should live on their own dedicated route at `/open-play`. This keeps the landing page clean, eliminates unnecessary database queries from the homepage, and gives Open Play players a dedicated, shareable URL.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- Create a dedicated Server Component page at `src/app/open-play/page.tsx` that fetches upcoming sessions using `getUpcomingSessions()`.
- Add a smooth skeleton loading state at `src/app/open-play/loading.tsx`.
- Remove `OpenPlaySection` and `getUpcomingSessions` SSR query entirely from `src/app/(public)/page.tsx`.
- Update desktop and mobile Navbar links to point to `/open-play` instead of `/#open-play`, highlighting the "Open Play" pill whenever the user is on `/open-play`.
- Update `BookingGrid.tsx` slot buttons to navigate to `/open-play`.
- Maintain full test coverage with unit tests for `/open-play/page.tsx`.

### Non-Goals
- Changing the session join or checkout flow (`/open-play/actions.ts` and Stripe/GCash payment logic remains untouched).
- Changing the admin open play management interface (`/admin/open-play`).

### Anti-Goals
- Adding client-side spinners where server rendering can be used.
- Leaving dead anchor code or unused imports in `src/app/(public)/page.tsx`.

---

## 3. Constraints
- Strict adherence to Ponytail mode (full): minimal diffs, zero extra dependencies, clean TypeScript types.
- Ensure all automated tests pass (`npm test -- --run`).

---

## 4. Approaches Considered
1. **Approach 1: Dedicated Server Component at `/open-play` (Selected by User)**
   - Create `src/app/open-play/page.tsx` as an async Server Component with matching `loading.tsx`.
   - Remove Open Play from landing page.
   - *Why chosen:* Matches `/book` architecture, gives fastest initial load, zero client hydration lag.
2. **Approach 2: Client-Rendered Route with API Endpoint**
   - *Rejected:* Slower initial render, requires unnecessary API endpoints.

---

## 5. Technical Specification

### A. New Page & Loading State
- `src/app/open-play/page.tsx`:
  - Server Component calling `getUpcomingSessions()`.
  - Renders a clean header ("Open Play Sessions", subtitle, badge) and displays `OpenPlaySection` or session cards with `JoinOpenPlayButton`.
- `src/app/open-play/loading.tsx`:
  - Renders matching header skeleton and 3 card skeleton blocks.

### B. Landing Page Cleanup (`src/app/(public)/page.tsx`)
- Remove `getUpcomingSessions()` import and execution.
- Remove `<OpenPlaySection>` render.
- Keep the Hero and About section intact.

### C. Navigation & Booking Grid Updates
- In `src/components/Navbar.tsx`:
  - Change desktop link from `href="/#open-play"` to `href="/open-play"`.
  - Change mobile dropdown item from `href="/#open-play"` to `href="/open-play"`.
  - Update `useEffect`: when `pathname.startsWith("/open-play")`, set `activeNav = "open-play"`.
- In `src/components/booking/BookingGrid.tsx`:
  - Update `router.push("/#open-play")` to `router.push("/open-play")`.

---

## 6. What's Left to the Builder
- Visual spacing and header copy styling adhering to `DESIGN.md`.
- Unit tests for `/open-play/page.test.tsx` matching `/book/page.test.tsx` pattern.
