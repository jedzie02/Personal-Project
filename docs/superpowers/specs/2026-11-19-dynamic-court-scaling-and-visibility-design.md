# Dynamic Court Scaling (No Min/Max Limits) & Visibility Sync Design

**Date:** 2026-11-19  
**Status:** Approved for Implementation Planning  
**Target:** Multi-tenant workspace (`apps/paddle-hub`, `apps/dinksync`, `packages/core`)

---

## 1. Intent & The Why
Pickleball venues range from boutique 1-to-2 court setups to large 8-to-15+ court complexes. Furthermore, venue operators periodically take individual courts offline for private events, resurfacing, or seasonal closure without wanting to permanently destroy historical booking data or recreate courts from scratch later.

This feature accomplishes two primary objectives:
1. **Unbounded Dynamic Court Scaling**: Remove all minimum and maximum court limits. The public booking grid (`/book`) must gracefully render any count of active courts (1, 3, 5, 8, 12, etc.). When 5 or more courts are active, the grid columns automatically shrink into a compact layout so more courts fit on screen while maintaining 100% mathematical row-to-column alignment without wrapping.
2. **Availability-Driven Visibility**: Changing a court's status to `"Not Available"` in the admin dashboard (`/admin/courts`) immediately and temporarily hides that court from the customer-facing booking grid. Changing it back to `"Available"` immediately restores it. Historical reservations, customer links, and payments remain preserved.

---

## 2. Goals & Non-Goals

### Goals
- **Unlimited Courts**: Support 1 to N courts dynamically with no artificial limit.
- **Adaptive Column Shrinking**: When active courts count is $\ge 5$, columns shrink from standard spacious width (~140px) to compact width (~96px desktop, ~85px mobile) with snugger badge padding, maximizing visible courts per viewport.
- **Strict Row & Column Alignment**: The sticky time column, the court headers, and all 15 hourly slot rows must share the exact same CSS grid column template, preventing any horizontal drift or column wrapping.
- **Zero-Data-Loss Visibility Toggle**: Switching status to `"Not Available"` sets `is_active = false` and `status = "Not Available"`, which excludes it from public booking queries while keeping all database relations intact.
- **Instant Cache Revalidation**: Trigger Next.js cache revalidation across `/book`, `/`, `/admin/courts`, and `/admin/schedule` upon status mutation.
- **Admin Schedule Parity**: Apply the dynamic inline grid template to `ScheduleTimeline.tsx` as well, ensuring that the staff schedule view also handles 5+ courts seamlessly without breaking.
- **Empty State Support**: Display an informative, friendly empty state when 0 courts are active.

### Non-Goals & Anti-Goals
- **Anti-Goal (Permanent Deletion)**: We will NOT perform SQL `DELETE` or cascade deletions when an admin reduces/hides courts.
- **Anti-Goal (Hardcoded CSS Switch)**: We will NOT use rigid Tailwind classes (`grid-cols-4`, `grid-cols-6`, `auto-fit`) that wrap or break beyond 6 courts.
- **Non-Goal**: We are not modifying the booking checkout, GCash QR payment processing, or customer authentication flows.

---

## 3. Approaches Considered & Trade-offs

| Approach | Architecture | Advantages | Disadvantages | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Approach 1: Dynamic CSS Grid with Adaptive Column Widths** | Single computed `gridTemplateColumns` inline style applied uniformly to header and all rows | Minimal code change; keeps existing cart selection and multi-hour span math intact; mathematically guarantees alignment across any court count; responsive horizontal scroll | Compact badges require tighter padding on 5+ courts | **Chosen by User** |
| **Approach 2: Fixed-Layout HTML Table (`<table>`)** | Rewrite grid using `<table>` with `table-layout: fixed` | Native table column alignment | High regression risk for sticky time column, keyboard accessibility, mobile scroll wrappers, and existing tests | **Rejected** |
| **Approach 3: CSS Subgrid** | CSS Subgrid specification inside parent grid wrapper | Modern CSS syntax | Inconsistent behavior in older mobile browsers and WebKit webviews; still requires width calculations | **Rejected** |

---

## 4. Detailed Component & System Design

### 4.1 Booking Grid Dynamic Layout (`BookingGrid.tsx`)
Currently, `BookingGrid.tsx` uses a helper function `getGridColsClass(count)` that hardcodes switch cases up to 6 courts and falls back to `auto-fit`, which wraps columns onto new lines and breaks alignment.

#### Dynamic Template Calculation
```typescript
const isCompact = activeCourts.length >= 5;
const colMinWidth = isCompact ? 96 : 140; // px
const mobileColMinWidth = isCompact ? 85 : 120; // px
const timeColWidth = 105; // px (sticky time label)
const desktopTimeColWidth = isCompact ? 140 : 170; // px

// Inline style for header and every hour row
const gridTemplateStyle = {
  gridTemplateColumns: `var(--time-col-w) repeat(${activeCourts.length}, minmax(var(--court-col-w), 1fr))`,
};
```

1. **Row Containers**: Both the court header `<div className="grid">` and every time row `<div className="grid">` apply the identical `style` object. This guarantees that column $k$ in Row 3 has the exact same width and offset as column $k$ in the header.
2. **Container Minimum Width**:
   ```typescript
   const minContainerWidth = timeColWidth + activeCourts.length * colMinWidth;
   ```
   Ensures smooth horizontal scrolling when total courts exceed viewport width, while allowing courts to expand evenly (`1fr`) if viewport space permits.
3. **Compact Slot Sizing (5+ Courts)**:
   - When `isCompact` is true:
     - Slot badge font: `text-[11px]` or `text-xs`.
     - Price label: `₱XXX` without line breaks.
     - Status badges ("Maintenance", "Open Play"): compact pill padding (`px-1.5 py-0.5`).
4. **Empty State**:
   - If `activeCourts.length === 0`: render a centered card: *"No courts are currently available for booking on this date."* with a date switcher or venue contact link.

### 4.2 Admin Availability & Visibility Control (`/admin/courts`)
1. **Status Mapping**:
   - `"Available"`: Open for bookings. `is_active = true`, `status = "Available"`. Rendered on booking grid.
   - `"Not Available"`: Hidden from public grid. `is_active = false`, `status = "Not Available"`. Hidden on booking grid.
   - `"Maintenance"`: Temporarily under maintenance. `is_active = true`, `status = "Maintenance"`. Visible on booking grid with disabled maintenance cell status.
2. **Server Action Synchronization (`actions.ts`)**:
   ```typescript
   export async function updateCourtStatusAction(courtId: string, status: CourtStatus) {
     const isActive = status === "Available" || status === "Maintenance";
     const dbStatus = status === "Maintenance" ? "Maintenance" : status === "Not Available" ? "Deactivated" : "Active";
     
     await supabase.from("courts").update({ status: dbStatus, is_active: isActive }).eq("id", courtId);
     
     revalidatePath("/admin/courts");
     revalidatePath("/admin/schedule");
     revalidatePath("/book");
     revalidatePath("/");
   }
   ```
3. **Service Query Alignment (`booking-grid.service.ts`)**:
   - Public booking grid queries `courts` where `is_active = true` AND `status NOT IN ('Deactivated', 'Not Available')`.
   - Courts are naturally sorted numerically (`Court 1, Court 2, ..., Court 10`).

---

## 5. Decisions Settled by Builder Review
The following questions were analyzed and settled to keep the implementation focused and reliable:

1. **Admin Schedule Timeline (`/admin/schedule`)**:
   - **Call:** Unlike the public booking grid (which completely hides `"Not Available"` courts), the staff schedule timeline continues showing all venue courts (via `getAllCourts()`), marking inactive courts with an `"Inactive"` badge. This allows staff to see existing reservations.
   - **Call:** `ScheduleTimeline.tsx` receives the same dynamic grid inline template refactor so it scales cleanly past 6 courts without column wrapping.
2. **Future Active Bookings on Hidden Courts**:
   - **Call:** Changing status to `"Not Available"` does NOT cancel existing customer bookings. When future reservations exist on that court, a non-blocking toast/notice confirms: *"Court hidden from public booking grid. Existing reservations remain active."*
3. **Core Engine Parity**:
   - **Call:** Service changes will be implemented in `packages/core/src/services/` and shared with `apps/paddle-hub`, ensuring consistent behavior across venues.

---

## 6. What's Left to the Builder
- Fine-tuning responsive CSS variable tokens for dark/light mode borders in compact view.
- Adding comprehensive Vitest unit tests verifying:
  1. Grid renders correctly with 1 court, 4 courts, 7 courts, and 12 courts.
  2. Setting status to "Not Available" filters the court out of `getBookingGridForDate`.
  3. Setting status back to "Available" restores the court in `getBookingGridForDate`.
  4. Visual alignment integrity between header and rows.
