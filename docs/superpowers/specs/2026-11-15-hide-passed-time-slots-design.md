# Design Doc: Hide Passed Time Slots with Toggle in Booking Grid

**Date:** 2026-11-15  
**Topic:** Collapse Earlier Passed Hours by Default with Toggle Button Below Court Header

---

## 1. Intent and Why
During facility operating hours (e.g. 9:00 AM – 11:00 PM), each elapsed hour renders a row of disabled "Passed" cells on the booking grid. When players visit the schedule later in the day, they have to scroll past numerous passed rows before reaching upcoming bookable slots.

This feature collapses earlier passed hours by default so players immediately see bookable slots. A clean toggle bar placed directly beneath the court column header allows players to expand and view earlier passed hours at any time.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- By default, hide/collapse hour rows where all cells have status `passed`.
- Place a toggle bar directly below the court header (`Time`, `Court 1`...`Court 4`) and above the first rendered hour row.
- Display a count of passed hours (e.g. `5 earlier hours passed`) and a button to toggle between `Show passed times ▼` and `Hide passed times ▲`.
- If 0 hours have passed (early morning or future dates), do not display the toggle bar.
- If viewing a past date where all hours are passed, default to showing the rows so the schedule does not appear empty.

### Non-Goals
- Do not filter out passed slots on the server; keep all rows in the client grid data for instant toggling without network roundtrips.

### Anti-Goals
- Avoid placing the toggle in remote menus or modals; it should be immediately discoverable right below the court header.

---

## 3. Approaches Considered

### Approach 1: Client-Side React State in `BookingGrid.tsx` (Selected)
- Manage `showPassed` boolean state. Filter hour rows when `false` and render the toggle bar below the header.
- **Why Selected:** Instantaneous toggling, zero re-fetching, preserves cart selections.

### Approach 2: Server Query Parameter
- Toggling triggers a URL navigation (`?showPassed=true`).
- **Trade-off:** Slower response time and re-renders server components unnecessarily.

---

## 4. Detailed Specification

### Component: `src/components/booking/BookingGrid.tsx`
1. **State:**
   - `const [showPassed, setShowPassed] = useState(false);`
2. **Identification of Passed Rows:**
   - An hour row is considered passed if every cell in that row is `status === "passed"`.
   - Compute `hasPassedHours` and `passedCount`.
   - For past dates (`isAllPassed`), default `showPassed` to `true` or show empty-state notification.
3. **Toggle Bar UI (Directly Below Court Headers):**
   - Renders right below the sticky court header row when `passedCount > 0`.
   - Shows: `<Clock /> {passedCount} earlier hours passed`
   - Button: `showPassed ? "Hide passed times" : "Show passed times"` with chevron up/down icon.
4. **Row Rendering:**
   - When `!showPassed`, skip rendering rows that are passed.
   - When `showPassed`, render all rows with passed rows styled at slightly reduced opacity for visual distinction.
