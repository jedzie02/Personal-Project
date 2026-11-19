# SDD ledger — plan: docs/superpowers/plans/2026-11-19-dynamic-court-scaling-and-visibility.md

Pre-flight: Task 1 produces filtered BookingGridData consumed by Task 2; Task 3 updates ScheduleTimeline; Task 4 syncs workspaces. All interfaces match.
BASE: fdd36d7
Task 1: complete (commits fdd36d7..245430f, tests: npx vitest run apps/paddle-hub/src/lib/services/booking-grid.service.test.ts -> 4 passed)
Task 2: complete (commits 245430f..75bfb87, tests: npx vitest run apps/paddle-hub/src/components/booking/BookingGrid.test.tsx -> 9 passed)
Task 3: complete (commits 75bfb87..31b3960, tests: npx vitest run apps/paddle-hub/src/components/admin/ScheduleTimeline.test.tsx -> 4 passed)
Task 4: complete (commits 31b3960..1c3f769, tests: npm run test -> 107 test files passed, 337 tests passed)
Review & Fix Pass: complete (commits 1c3f769..3ab8d85, tests: npx vitest run -> 108 test files passed, 347 tests passed)
- C1 Auth hardening: requireAdmin() enforced on server actions in apps/paddle-hub and src.
- C2 Active status: is_active set true for Available and Maintenance; false only for Not Available / Deactivated.
- C3 Offline court bookings: ScheduleTimeline evaluates live bookings prior to offline status placeholders.
- C4 Dynamic grid template: inline style={{ gridTemplateColumns }} with CSS variables ensures flawless 0 to N court alignment regardless of Tailwind v4 static pruning.
- C5 Monorepo alignment: packages/core, apps/dinksync, apps/paddle-hub, and src synchronized with 100% test suite green.
