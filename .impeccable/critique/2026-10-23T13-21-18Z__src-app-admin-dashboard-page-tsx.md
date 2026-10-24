---
target: src/app/admin/dashboard/page.tsx
total_score: 18
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\jedrik\\Projects\\pickle-wb\\src\\app\\admin\\dashboard\\page.tsx"
target_fingerprint: "sha256:2e1f2c0d04b6032abc7eb5c345962d1387cf09c2c27d64db447ae0df09081e83"
target_path: "C:\\Users\\jedrik\\Projects\\pickle-wb\\src\\app\\admin\\dashboard\\page.tsx"
timestamp: 2026-10-23T13-21-18Z
slug: src-app-admin-dashboard-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Hardcoded trend strings; no loading state or data-freshness indicator |
| 2 | Match System / Real World | 2 | DollarSign icon on peso product; Pending Approvals maps to upcoming count |
| 3 | User Control and Freedom | 2 | Read-only; no drilldown from KPIs; admin cannot act from dashboard |
| 4 | Consistency and Standards | 3 | Badge status values are raw lowercase DB strings |
| 5 | Error Prevention | 1 | Promise.all with no try/catch; page crashes silently on any fetch failure |
| 6 | Recognition Rather Than Recall | 3 | KPI layout scannable; table headers clear |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no quick-actions, no bulk operations |
| 8 | Aesthetic and Minimalist Design | 3 | Hero-metric KPI pattern used as page structure |
| 9 | Error Recovery | 1 | No error boundary; no way to distinguish no data from zero |
| 10 | Help and Documentation | n/a | Operate surface |
| Total | | 18/36 | Poor |

## Priority Issues
- [P0] Hardcoded trend labels misrepresent live data (lines 61-84)
- [P1] DollarSign icon on revenue card (line 67)
- [P1] Pending Approvals label maps to upcomingBookingsCount (lines 79-84)
- [P1] No error boundary on Promise.all (lines 49-54)
- [P2] Badge status values are lowercase raw DB strings
