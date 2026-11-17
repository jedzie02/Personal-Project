# Admin Courts Removal (Single & Bulk) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide single-court and bulk-court deletion controls in the Paddle Hub Admin Courts dashboard (`/admin/courts`) so admins can remove one or multiple courts with confirmation directly from the UI.

**Architecture:** Extend `court.service.ts` to support deleting multiple court IDs in a single query. Update `apps/paddle-hub/src/app/admin/courts/page.tsx` with card-level trash actions, checkbox selection states, a "Select All" toggle, and a top-bar "Delete Selected (X)" bulk action button.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide icons (`Trash2`, `CheckSquare`, `Square`), Supabase JS Client, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-17-admin-court-removal-design.md](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-17-admin-court-removal-design.md)

## Global Constraints
- Must NOT break or remove "+ Add Court" or "Edit Rate" features.
- All destructive actions must require browser confirmation before executing.
- Preserves database referential integrity and refreshes client state immediately after deletion.

## Review Focus
- Single deletion confirmation cancellation does not delete court.
- Bulk deletion with zero selected courts disables or hides bulk delete button.
- Deleting courts updates the court count and clears the selection state.

---

### Task 1: Multi-Court Deletion Service Function

**Files:**
- Modify: `apps/paddle-hub/src/lib/services/court.service.ts`
- Modify: `packages/core/src/services/court.service.ts`
- Test: `apps/paddle-hub/src/lib/services/court.service.test.ts`

**Interfaces:**
- Produces: `deleteCourts(ids: string[]): Promise<ServiceResult>`

- [ ] **Step 1: Write test for `deleteCourts`**
Add test in `court.service.test.ts` ensuring `deleteCourts(["c1", "c2"])` calls supabase delete with `.in("id", ids)`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run apps/paddle-hub/src/lib/services/court.service.test.ts`
Expected: FAIL (`deleteCourts is not a function`).

- [ ] **Step 3: Implement `deleteCourts` in `court.service.ts`**
In `apps/paddle-hub/src/lib/services/court.service.ts` and `packages/core/src/services/court.service.ts`:
```ts
export async function deleteCourts(ids: string[]): Promise<ServiceResult> {
    if (!ids || ids.length === 0) return { success: true };
    const supabase = await createClient();
    const { error } = await supabase.from("courts").delete().in("id", ids);
    if (error) return { success: false, error: error.message };
    return { success: true };
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run apps/paddle-hub/src/lib/services/court.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/paddle-hub/src/lib/services/court.service.ts packages/core/src/services/court.service.ts apps/paddle-hub/src/lib/services/court.service.test.ts
git commit -m "feat(court-service): add deleteCourts bulk deletion function"
```

---

### Task 2: Single and Bulk Court Deletion UI in `/admin/courts`

**Files:**
- Modify: `apps/paddle-hub/src/app/admin/courts/page.tsx`
- Test: `apps/paddle-hub/src/app/admin/courts/page.test.tsx`

**Interfaces:**
- Consumes: `supabase.from("courts").delete()` (client component) or `deleteCourt` / `deleteCourts`
- State: `selectedIds: Set<string>`
- Actions: `handleDeleteCourt(id: string, name: string)`, `handleDeleteSelected()`

- [ ] **Step 1: Write UI tests for single delete and bulk delete buttons**
In `apps/paddle-hub/src/app/admin/courts/page.test.tsx`, add test asserting presence of delete buttons and selection checkbox per court card.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run apps/paddle-hub/src/app/admin/courts/page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement UI in `apps/paddle-hub/src/app/admin/courts/page.tsx`**
1. Add state:
```tsx
const [selectedCourtIds, setSelectedCourtIds] = useState<Set<string>>(new Set());
const [deleting, setDeleting] = useState(false);
```
2. Add selection toggle helpers:
- `toggleSelectCourt(id: string)`
- `toggleSelectAll()`
3. Add single delete handler:
```tsx
const handleDeleteCourt = async (courtId: string, courtName: string) => {
  if (!confirm(`Are you sure you want to delete ${courtName}? This cannot be undone.`)) return;
  setDeleting(true);
  const { error } = await supabase.from("courts").delete().eq("id", courtId);
  if (error) {
    setErrorMessage(error.message);
  } else {
    setSelectedCourtIds(prev => { const n = new Set(prev); n.delete(courtId); return n; });
    await fetchCourts();
  }
  setDeleting(false);
};
```
4. Add bulk delete handler:
```tsx
const handleDeleteSelected = async () => {
  const count = selectedCourtIds.size;
  if (!confirm(`Are you sure you want to delete ${count} selected court${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
  setDeleting(true);
  const { error } = await supabase.from("courts").delete().in("id", Array.from(selectedCourtIds));
  if (error) {
    setErrorMessage(error.message);
  } else {
    setSelectedCourtIds(new Set());
    await fetchCourts();
  }
  setDeleting(false);
};
```
5. In Card:
- Add checkbox in top-left next to court name.
- Add Trash2 icon button in bottom action bar.
6. In Top Header:
- When `selectedCourtIds.size > 0`, display:
  - `<Button variant="destructive" size="sm" onClick={handleDeleteSelected}>Delete Selected ({selectedCourtIds.size})</Button>`
  - `<Button variant="outline" size="sm" onClick={() => setSelectedCourtIds(new Set())}>Cancel Selection</Button>`
- When courts exist, add a "Select All" toggle button.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run apps/paddle-hub/src/app/admin/courts/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/paddle-hub/src/app/admin/courts/page.tsx apps/paddle-hub/src/app/admin/courts/page.test.tsx
git commit -m "feat(paddle-hub): add single delete and bulk delete court controls to admin"
```

---

### Task 3: Full Workspace Verification

**Files:**
- Verification only

- [ ] **Step 1: Run all paddle-hub unit tests**
Run: `npx vitest run apps/paddle-hub`
Expected: 100% PASS.

- [ ] **Step 2: Build paddle-hub**
Run: `npm run build:paddle-hub`
Expected: Code 0, all routes compiled cleanly.
