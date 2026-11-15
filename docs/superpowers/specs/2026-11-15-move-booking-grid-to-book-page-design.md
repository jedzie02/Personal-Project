# Dedicated `/book` Page & Static Homepage Hero Design

## 1. Intent & Why
Previously, the full court availability schedule (`BookingGrid`), date picker (`DateSelector`), and the "Book a court in 3 simple steps" guide were embedded directly inside the landing page (`src/app/(public)/page.tsx`). 

This architecture caused two issues:
1. The entire homepage was blocked during initial render waiting for Supabase to resolve schedule and court data.
2. The loading fallback (`src/app/(public)/loading.tsx`) flashed grey skeleton placeholder boxes over the static navbar, hero headline, CTA buttons, and court simulator animation, despite those components being 100% static marketing content.

Moving the 3-step guide and the court booking schedule to a dedicated `/book` page makes the homepage fast, clean, and instant-loading, while giving players a focused reservation flow.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- **Dedicated Booking Page (`/book`)**:
  - Replace the redirect stub in `src/app/book/page.tsx` with a full async Server Component.
  - Accept query parameters: `date`, `selectCourt`, `selectHour`, `error`.
  - Fetch courts and `getBookingGridForDate(date)` via server services.
  - Render:
    1. Top navigation (`Navbar`)
    2. "Book a court in 3 simple steps" guide
    3. Court status overview pills
    4. `DateSelector`
    5. `BookingGrid` (with cart bar, passed-hours toggle, and pending reservation resume)
    6. Footer
- **Lightweight Static Homepage (`/`)**:
  - Remove the "Book a court in 3 simple steps" section and `#book-a-court` grid section from `src/app/(public)/page.tsx`.
  - Change hero "Book a Court" CTA buttons to link to `/book`.
  - In `HeroQuickSlots`, clicking any 1-tap quick slot card navigates to `/book?date=${date}&selectCourt=${courtId}&selectHour=${hour}`, pre-selecting that slot into the cart bar on `/book`.
- **Navigation Update (`Navbar.tsx`)**:
  - Change the "Book Court" nav link target from `#book-a-court` to `/book`.
- **Loading Skeleton Optimization**:
  - In `src/app/(public)/loading.tsx`: Remove skeleton rectangles from the Navbar and Hero section so the landing page renders static branding and hero instantly without grey placeholder blocks. Remove `BookingGridSkeleton` from `(public)/loading.tsx`.
  - In `src/app/book/loading.tsx`: Render a clean booking skeleton for the `/book` page.

### Non-Goals
- Modifying the checkout flow (`/confirm-booking`, `/book/payment`).
- Changing admin schedule or open play backend models.

### Anti-Goals
- Breaking 1-tap quick booking from the homepage hero.
- Introducing new client-side state libraries or unnecessary dependencies.

---

## 3. Approaches Considered

1. **Approach 1 (Chosen): Dedicated `/book` Page + Homepage Quick-Slot Deep Linking**
   - Clean route separation.
   - Instant homepage render.
   - Quick slots on homepage link directly to `/book?date=...&selectCourt=...&selectHour=...`, which automatically pre-populates the cart.
2. **Approach 2: Pure Static Homepage (No Quick Slots on Home)**
   - Completely removes quick slots from the homepage. Rejected because quick slots provide high-value, instant booking glance for returning players.

---

## 4. Key Component Changes

### 1. `src/app/book/page.tsx`
- Replace redirect with full booking layout:
  - Header: `<Navbar />`
  - Container with max-width `max-w-6xl`
  - "Book a court in 3 simple steps" guide
  - Live court status overview badges
  - `<DateSelector selectedDate={date} today={today} />`
  - `<BookingGrid data={gridData} initialSelectCourt={selectCourt} initialSelectHour={selectHour} />`
  - Footer

### 2. `src/app/(public)/page.tsx`
- Remove the 3-step section (`Book a court in 3 simple steps`).
- Remove the `#book-a-court` section.
- "Book a Court" CTA button points to `/book`.
- `HeroQuickSlots`: Each quick slot card links directly to `/book?date=${activeDate}&selectCourt=${courtId}&selectHour=${hour}` instead of dispatching the window custom event.

### 3. `src/components/Navbar.tsx`
- Update `Book Court` nav link href:
  - Desktop nav: `<Link href="/book" ...>Book Court</Link>`
  - Mobile menu: `<Link href="/book" ...>Book Court</Link>`

### 4. `src/app/(public)/loading.tsx`
- Replace grey skeleton rectangles in the hero with the clean static hero presentation (or lightweight shell) so visitors never see flashing skeleton blocks on the homepage hero.
- Remove `BookingGridSkeleton` since the grid is no longer on `/`.

### 5. `src/app/book/loading.tsx`
- Render `BookingGridSkeleton` and the 3-step wireframe while `/book` loads.

---

## 5. Verification & Tests
- Vitest unit tests:
  - Update `src/app/(public)/loading.test.tsx`.
  - Add test for `src/app/book/page.tsx` rendering the 3-step guide and booking grid.
  - Verify `BookingGrid.test.tsx` and all 20 existing test suites pass (`npm test -- --run`).
