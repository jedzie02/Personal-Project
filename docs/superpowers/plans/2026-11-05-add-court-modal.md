# Add Court Modal Dialog & Default Rate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline 5-column "Add Court" form on `/admin/courts` with a clean modal dialog triggered by an "+ Add Court" header button and update the default hourly rate to ₱200.

**Architecture:** Create an accessible, modular `<AddCourtModal>` component in `src/components/ui/admin/AddCourtModal.tsx` that manages court input values, handles escape/backdrop dismissal, and provides a default hourly rate of 200. Integrate this component into `src/app/admin/courts/page.tsx`, removing the permanent inline `<Card>` form and adding the "+ Add Court" trigger button in the page header.

**Tech Stack:** React 19 Client Component, Next.js 16, Tailwind CSS v4, Lucide React, Vitest, `react-dom/server`.

**Spec:** [`docs/superpowers/specs/2026-11-05-add-court-modal-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-05-add-court-modal-design.md)

## Global Constraints
- Preserve existing Supabase database operations and queries on the `courts` table.
- Default hourly rate must be 200 across initial state, placeholder, and fallback parsing.
- Dialog must implement accessibility attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
- Dismissal must be supported via outside backdrop click, Cancel button, `X` icon button, and `Escape` key.
- All existing tests in the suite must pass with 0 regressions.

## Review Focus
- **Default Hourly Rate (₱200):** When opened, the hourly rate field must default to `"200"` rather than `"25"`.
- **Modal Toggle & Dismissal:** When `isOpen={false}`, the component returns `null`; when `isOpen={true}`, the backdrop and dialog are rendered.
- **Escape Key Accessibility:** Pressing `Escape` while the modal is open triggers the `onClose` callback.
- **Form Submission & Reset:** Submitting valid form values calls `onSubmit` with `{ name, description, hourlyRate, status }` and resets internal inputs.
- **Clean Admin Header:** The header cleanly displays the status badges and the "+ Add Court" button without horizontal squishing.

---

### Task 1: Create `AddCourtModal` Component with Unit Tests

**Files:**
- Create: `src/components/ui/admin/AddCourtModal.tsx`
- Test: `src/components/ui/admin/AddCourtModal.test.tsx`

**Interfaces:**
- Consumes: `CourtStatus = "Available" | "Not Available" | "Maintenance"`
- Produces:
  ```tsx
  export interface AddCourtModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (courtData: {
      name: string;
      description: string;
      hourlyRate: string;
      status: CourtStatus;
    }) => Promise<void> | void;
    isSubmitting?: boolean;
    errorMessage?: string | null;
  }
  export function AddCourtModal(props: AddCourtModalProps): React.JSX.Element | null;
  ```

- [ ] **Step 1: Write failing unit test in `src/components/ui/admin/AddCourtModal.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AddCourtModal } from "./AddCourtModal";

describe("AddCourtModal", () => {
  it("renders nothing when isOpen is false", () => {
    const html = renderToStaticMarkup(
      <AddCourtModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(html).toBe("");
  });

  it("renders modal dialog with default rate 200 and required fields when isOpen is true", () => {
    const html = renderToStaticMarkup(
      <AddCourtModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Add Court');
    expect(html).toContain('value="200"');
    expect(html).toContain('Available (Open for player reservations)');
    expect(html).toContain('Hourly Rate (₱)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/admin/AddCourtModal.test.tsx`
Expected: FAIL (Cannot find module `./AddCourtModal`).

- [ ] **Step 3: Implement `AddCourtModal` in `src/components/ui/admin/AddCourtModal.tsx`**

Implement `<AddCourtModal>`:
- If `!isOpen`, return `null`.
- Add `useEffect` listening for `Escape` key to call `onClose()`.
- State for `name` (default `""`), `description` (default `""`), `hourlyRate` (default `"200"`), `status` (default `"Available"`).
- Render dialog backdrop with `onClick={onClose}`.
- Dialog card container stopping propagation (`onClick={(e) => e.stopPropagation()}`).
- Form inputs:
  - Court Name (`Input`, required, autoFocus).
  - Hourly Rate (`Input`, type="number", min="0", step="any", required, with `₱` adornment, default `"200"`).
  - Location / Notes (`Input`, optional).
  - Initial Status (`select` with the 3 `STATUS_OPTIONS`).
- Action buttons:
  - Cancel (`Button`, variant="outline", onClick={onClose}).
  - Add Court submit button (with `Loader2` spinner when `isSubmitting`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/admin/AddCourtModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/admin/AddCourtModal.tsx src/components/ui/admin/AddCourtModal.test.tsx
git commit -m "feat(admin): add AddCourtModal component with tests and default 200 rate"
```

---

### Task 2: Integrate `AddCourtModal` into Admin Courts Page

**Files:**
- Modify: `src/app/admin/courts/page.tsx`
- Test: `src/app/admin/courts/page.test.tsx`

**Interfaces:**
- Consumes: `<AddCourtModal>` from `@/components/ui/admin/AddCourtModal`
- Produces: Header trigger button and modal invocation inside `AdminCourtsPage`.

- [ ] **Step 1: Write integration test in `src/app/admin/courts/page.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCourtsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

describe("AdminCourtsPage Add Court UI", () => {
  it("renders Add Court button in header and does not render the inline 5-column form by default", () => {
    const html = renderToStaticMarkup(<AdminCourtsPage />);

    // Header has the Add Court button
    expect(html).toContain("Add Court");
    // The previous inline form grid class sm:grid-cols-5 is removed
    expect(html).not.toContain("sm:grid-cols-5");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/admin/courts/page.test.tsx`
Expected: FAIL (expect(html).not.toContain("sm:grid-cols-5") fails because the inline form is currently rendered).

- [ ] **Step 3: Update `src/app/admin/courts/page.tsx`**

1. Import `AddCourtModal` from `@/components/ui/admin/AddCourtModal`.
2. Add `const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);`.
3. In header, insert the "+ Add Court" button next to the count badges:
   ```tsx
   <Button
     onClick={() => setIsAddCourtOpen(true)}
     className="h-8 gap-1.5 text-xs font-semibold"
     size="sm"
   >
     <Plus className="w-4 h-4" /> Add Court
   </Button>
   ```
4. Remove the permanent inline `<Card>` containing the form (lines 214–282).
5. Update `handleCreateCourt`:
   - Accept `{ name, description, hourlyRate, status }` from the modal.
   - Fallback rate: `parseFloat(hourlyRate) || 200`.
   - On success, close modal (`setIsAddCourtOpen(false)`) and call `fetchCourts()`.
6. Mount `<AddCourtModal>`:
   ```tsx
   <AddCourtModal
     isOpen={isAddCourtOpen}
     onClose={() => setIsAddCourtOpen(false)}
     onSubmit={handleCreateCourt}
     isSubmitting={creating}
     errorMessage={errorMessage}
   />
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/admin/courts/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full test suite and verify build**

Run: `npx vitest run`
Run: `npm run build`
Expected: All tests pass and Next.js build succeeds with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/courts/page.tsx src/app/admin/courts/page.test.tsx docs/superpowers/plans/2026-11-05-add-court-modal.md
git commit -m "refactor(admin): replace inline add court form with modal dialog and 200 base rate"
```

