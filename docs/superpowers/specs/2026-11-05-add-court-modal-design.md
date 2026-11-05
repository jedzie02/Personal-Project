# Add Court Modal Dialog & Default Rate Redesign

## Intent & Why
The current "Add Court" form in `src/app/admin/courts/page.tsx` is permanently rendered as a 5-column horizontal strip directly above the courts list. This squeezes the form controls—particularly the initial status dropdown and location notes—and permanently consumes prime vertical screen real estate for an administrative action performed infrequently. Additionally, the default hourly rate is set to ₱25 rather than the venue standard baseline of ₱200.

## Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Replace the permanent inline 5-column card with an **"+ Add Court"** button in the header next to the status badges.
  - Open a clean, focused modal dialog with a comfortable multi-row layout:
    - Row 1: Court Name & Hourly Rate (₱) side-by-side.
    - Row 2: Location / Notes (Optional).
    - Row 3: Initial Status selection with descriptive labels.
  - Update default hourly rate from ₱25 to ₱200 across initial state and form reset.
  - Support standard modal dismissal (backdrop click, Cancel button, "X" close icon, `Escape` key).
  - Automatically close the dialog and refresh the courts list upon successful creation.
- **Non-Goals:**
  - Modifying Supabase schema, table migrations, or server-side RLS policies.
  - Modifying the existing court cards or the separate "Edit Rate" dialog.
- **Anti-Goals:**
  - Breaking responsiveness or causing horizontal overflow on mobile viewports.
  - Losing error reporting if a court name collision occurs.

## Constraints
- React 19 Client Component conventions in `src/app/admin/courts/page.tsx`.
- Tailwind CSS v4 styling matching the existing dark/light theme variables in `src/app/globals.css`.
- Ponytail principles: smallest change that solves the issue, reusing the modal patterns already implemented for `Edit Rate` on the same page.

## Approaches Considered
1. **Header Button + Modal Dialog (Selected):**
   - Moves the form into a modal triggered by a primary header button.
   - *Tradeoffs:* Adds a click to open, but eliminates clutter, gives inputs breathing room, and reuses the existing dialog pattern on the page.
2. **Collapsible Inline Card:**
   - Hides the inline form behind a toggle button.
   - *Tradeoffs:* Avoids a modal overlay, but pushes court cards down whenever opened.
3. **Placeholder Card in the Grid:**
   - Adds a dashed card tile inside the court list.
   - *Tradeoffs:* Blends into the grid, but looks cluttered alongside live status management.

*Selection:* The user approved **Approach 1** with the default hourly rate configured to **₱200**.

## The Decided "How"
In `src/app/admin/courts/page.tsx`:
1. **State:**
   - Add `const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);`.
   - Update `hourlyRate` initial state to `"200"`.
2. **Header Action:**
   - In the header actions container (next to the status badges), add a primary button:
     ```tsx
     <Button onClick={() => setIsAddCourtOpen(true)} className="...">
       <Plus className="w-4 h-4 mr-1.5" /> Add Court
     </Button>
     ```
3. **Form Removal & Modal Replacement:**
   - Remove the permanent inline `<Card>` containing the 5-column form.
   - Add a modal dialog conditionally rendered when `isAddCourtOpen` is true (matching lines 373–450 `editingCourt` styling).
   - Layout inside modal:
     - Header: "Add New Court", description, and close button (`X`).
     - Grid row 1: Court Name (`Input`), Hourly Rate with `₱` adornment (`Input`, default `200`).
     - Grid row 2: Location / Notes (`Input`).
     - Grid row 3: Initial Status (`select` with clean options).
     - Footer: "Cancel" button and "+ Add Court" submit button with loading spinner (`creating`).
4. **Creation Handler:**
   - In `handleCreateCourt`:
     - Parse `parseFloat(hourlyRate) || 200`.
     - On successful insert, reset `hourlyRate` to `"200"`, `setIsAddCourtOpen(false)`, and call `fetchCourts()`.
5. **Keyboard Accessibility:**
   - Add `Escape` key listener or modal key handler to close the dialog when pressed.

## What's Left to the Builder
- Implementing the modal and state in `src/app/admin/courts/page.tsx`.
- Verifying the build and tests pass cleanly.

