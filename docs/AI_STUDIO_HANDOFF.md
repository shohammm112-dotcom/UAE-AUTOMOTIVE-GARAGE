# AI Studio Handoff

## Current Milestone
Step 5.5 — Staff Job Operations & Workshop Execution (Completed & Verified)

## Project Architecture
- **Frontend**: React 19, React Router, Vite, Tailwind CSS v4, Lucide React, Shadcn/ui
- **Backend**: Express (embedded using Vite middleware in dev, bundled via esbuild for prod), RESTful endpoints, Domain-Driven Design
- **Persistence**: InMemory repositories (Deferred to Firestore via Antigravity)
- **Auth**: Token-based middleware using mock verifier (Deferred to Firebase Auth via Antigravity)
- **Communication**: Frontend communicates with backend EXCLUSIVELY via `ApiClient` through REST API endpoints.

## Completed & Audited Work
- **Step 5.4 — Staff Operational Control Center**:
  - Implemented `GET /api/v1/internal/jobs` (Staff jobs list).
  - Implemented `GET /api/v1/internal/estimates` (Staff estimates list).
  - Implemented `GET /api/v1/internal/invoices` (Staff invoices list).
  - Updated `StaffDashboardPage.tsx` with live data derivation.
  - Built out `StaffJobsPage.tsx`, `StaffEstimatesPage.tsx`, and `StaffInvoicesPage.tsx`.
- **Step 5.5 — Staff Job Operations & Workshop Execution**:
  - Transformed `/staff/jobs/:id` (`StaffJobDetailPage.tsx`) into an operational workshop workbench.
  - Implemented `GET /api/v1/internal/jobs/:id` and `getJobDetailsForStaff` in `JobApplicationService`, enforcing strict staff role validation (`workshopStaffGuard`).
  - Implemented operational action workbench respecting legal domain branches from `JobStateMachine` (`LEGAL_TRANSITIONS`).
  - Maintained vehicle and customer context with deep links (`/staff/vehicles/:id` and `/staff/customers/:id`).
  - Aligned authorization guards between middleware and application layer for all workshop technical roles (`admin`, `workshop_manager`, `service_advisor`, `advisor`, `technician`, `mechanic`).
  - Re-routed stage mutations via authoritative backend endpoint `POST /api/v1/internal/jobs/:id/stage`.
  - Added comprehensive automated test suite `src/tests/staffJobOperations.test.ts` integrated into `runAllTests.ts`.

### Backend Updates
- Expanded `JobApplicationService` with `getJobDetailsForStaff` and aligned `advanceJobStage` allowed roles.
- Exposed `GET /api/v1/internal/jobs/:id` in `internalRoutes.ts` with `workshopStaffGuard`.
- Validated role boundaries ensuring customers cannot access staff APIs or mutate workshop state (returns 403 FORBIDDEN).

## Verified
- **Routing and Navigation**: Staff workbench accessible at `/staff/jobs/:id` from global job queue.
- **Backend Authorization Integrity**: Enforced SEC-HIGH boundaries. Customers cannot read or mutate internal job state.
- **State Machine Enforcement**: Domain rules reject invalid stage jumps with `INVALID_STATE_TRANSITION` (HTTP 400).
- **Tests**: 86/86 passed (0 failed) across all suites including `staffJobOperations.test.ts`.
- **Code Quality**: `npm run lint` and `npm run build` passing cleanly.

## API Gaps & Deferred Items
- `JobResponseDto.estimateId`: To automatically link Jobs directly to Estimates (currently navigational link provided to Estimates portal).
- `Technician assignment mutation`: Documented as DEFERRED; technician field displayed read-only on Workbench.

## Non-Blocking Warnings
- **Standard Vite chunk size warning** exists.

## Next Step
Step 5.6 / Step 6 — Next planned staff commercial operations or production deployment milestone.
