# Payment Method Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive 3-option payment method selector (GCash QR, Cash, Card) on the "Confirm your booking" page.

**Architecture:** Update `ConfirmBookingClient.tsx` to add interactive `selectedPaymentMethod` state and a 3-button selection grid, replacing the static read-only badge. The chosen method is passed to `submitConfirmBooking`.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS, Lucide React (`QrCode`, `Banknote`, `CreditCard`), TypeScript.

**Spec:** [Design Specification: 3-Choice Payment Selector on "Confirm your booking"](#)

## Global Constraints
- Supported payment methods: `"GCash QR"`, `"Cash walk in"`, `"Credit Card"`.
- Clean UI adhering to DESIGN.md tokens and high touch target floors (min 44px height).
- Zero TypeScript errors (`npx tsc --noEmit`).
- All 24 unit tests pass (`npm run test`).

## Review Focus
- Default selection is `"GCash QR"` or matches query parameter if passed.
- Clicking another option immediately updates active styling and updates the payload sent to `submitConfirmBooking`.
- Mobile screens render the 3 choices with clean responsive layout without overflow.

---

### Task 1: Add Interactive Payment Method Selector to `ConfirmBookingClient.tsx`

**Files:**
- Modify: `src/app/confirm-booking/ConfirmBookingClient.tsx`

**Interfaces:**
- `selectedPaymentMethod`: `"GCash QR" | "Cash walk in" | "Credit Card"`.
- `submitConfirmBooking({ ..., paymentMethod })`: receives the user-selected method.

- [ ] **Step 1: Add state for `selectedPaymentMethod`**
In `src/app/confirm-booking/ConfirmBookingClient.tsx`, define:
```tsx
const initialPaymentMethod = (searchParams.get("paymentMethod") as "GCash QR" | "Cash walk in" | "Credit Card") || "GCash QR";
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"GCash QR" | "Cash walk in" | "Credit Card">(
    initialPaymentMethod === "Credit Card" || initialPaymentMethod === "Cash walk in" ? initialPaymentMethod : "GCash QR"
);
```

- [ ] **Step 2: Replace static payment badge with interactive 3-card toggle**
In the card body, render:
```tsx
<div className="space-y-2 pt-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
        Payment Method
    </label>
    <div className="grid grid-cols-3 gap-2">
        {PAYMENT_OPTIONS.map((opt) => (
            <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPaymentMethod(opt.id)}
                className={...}
            >
                <opt.icon className="size-4" />
                <span>{opt.label}</span>
            </button>
        ))}
    </div>
</div>
```

- [ ] **Step 3: Update `handleConfirmBooking` to pass `selectedPaymentMethod`**
Ensure `paymentMethod: selectedPaymentMethod` is passed into `submitConfirmBooking`.

---

### Task 2: Verification

- [ ] **Step 1: Run TypeScript check**
Run: `npx tsc --noEmit --project tsconfig.json`
Expected: 0 errors

- [ ] **Step 2: Run unit tests**
Run: `npm run test`
Expected: 24 passed (24)

- [ ] **Step 3: Run impeccable detect**
Run: `.agent\skills\impeccable\scripts\impeccable.cmd detect --json src/app/confirm-booking/ConfirmBookingClient.tsx`
Expected: 0 issues

