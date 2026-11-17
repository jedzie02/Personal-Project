# Admin Courts Removal (Single & Bulk) Design

**Date:** 2026-11-17  
**Status:** Ready for Review  
**Target:** `apps/paddle-hub`

---

## 1. Goal & Context
Venue administrators need an intuitive way inside the Admin Courts dashboard (`/admin/courts`) to remove a single court or multiple courts at once without using manual SQL queries or database scripts. The existing "+ Add Court" functionality must remain intact.

---

## 2. Approaches Considered

1. **Approach A (Selected): Individual Card Delete Button + Bulk Checkbox Selection**
   - Each court card displays a distinct "Delete" button (trash icon).
   - Each card displays a selection checkbox. When one or more courts are checked, a "Delete Selected (X)" button appears in the top header.
   - *Why chosen:* Provides immediate single-court removal as well as flexible multi-court removal in one unified screen without extra dialog layers.

2. **Approach B: Card Delete Button + Top Stepper (- Remove Court)**
   - *Rejected:* Stepper only removes the latest/highest court; administrators cannot select arbitrary courts (e.g. Court 2 and Court 4).

3. **Approach C: Separate Modal for Batch Management**
   - *Rejected:* Adds unnecessary modal friction for common management actions.

---

## 3. Detailed UI & Interaction Design

### A. Individual Court Deletion
- Located on each court card in the bottom action bar next to "Edit Rate".
- Styled as a subtle destructive icon button (Trash2).
- Clicking prompts a confirmation dialog: *"Are you sure you want to delete [Court Name]? This cannot be undone."*
- Deletes the court via Supabase/service action and updates the local state immediately.

### B. Bulk Court Deletion
- Checkbox added to the top-left of each court card.
- A "Select All" toggle appears in the header toolbar when courts exist.
- When `selectedCourtIds.length > 0`:
  - An active selection bar appears in the header: *"X courts selected"*.
  - A red **"Delete Selected (X)"** button appears.
  - Clicking prompts confirmation: *"Are you sure you want to delete X selected courts?"*
  - Deletes all selected court IDs in one database call and clears the selection.

### C. Booking Conflict Safety
- If a court has future confirmed bookings, the admin receives a clear confirmation alert informing them that deleting will cancel or unlink associated future reservations.

---

## 4. Technical Implementation Scope
1. **`apps/paddle-hub/src/app/admin/courts/page.tsx`**:
   - Add state: `selectedCourtIds: Set<string>`
   - Add handlers: `handleDeleteSingle(courtId, courtName)`, `handleDeleteBulk()`
   - Add checkbox component on card header and bulk actions toolbar in header.
2. **`apps/paddle-hub/src/lib/services/court.service.ts`**:
   - Ensure `deleteCourts(ids: string[])` is available for multi-delete.
3. **Automated Verification**:
   - Add unit test in `apps/paddle-hub/src/app/admin/courts/page.test.tsx` verifying single delete and bulk selection rendering and execution.
