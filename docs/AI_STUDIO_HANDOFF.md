# AI Studio Handoff

## Current Milestone
Step 5.3 — Customer & Vehicle Master + Workshop Context (Completed & Audited)

## Project Architecture
- **Frontend**: React 19, React Router, Vite, Tailwind CSS v4, Lucide React, Shadcn/ui
- **Backend**: Express (embedded using Vite middleware in dev, bundled via esbuild for prod), RESTful endpoints, Domain-Driven Design
- **Persistence**: InMemory repositories (Deferred to Firestore via Antigravity)
- **Auth**: Token-based middleware using mock verifier (Deferred to Firebase Auth via Antigravity)
- **Communication**: Frontend communicates with backend EXCLUSIVELY via `ApiClient` through REST API endpoints.

## Completed & Audited Work
- Created `StaffCustomersPage` for listing all customers (`GET /internal/customers`) with frontend-side search support.
- Created `StaffCustomerDetailPage` displaying contact info, registered vehicles (`GET /internal/customers/:id/vehicles`), and workshop history (`GET /internal/customers/:id/jobs`).
- Created `StaffVehicleDetailPage` displaying full vehicle identity, owner linkage, and vehicle service history (`GET /internal/vehicles/:id/jobs`).
- Added robust loading, error, and empty states.
- Reused StaffShell capabilities and integrated Customers into the navigation.
- Established the foundational Customer -> Vehicle -> Job identity linkage via authoritative IDs, without denormalizing identities.

### Backend Updates
- Expanded `ICustomerRepository`, `MockCustomerRepository`, `FirestoreCustomerRepository` with `findAll` capability.
- Expanded `IJobRepository`, `MockJobRepository`, `FirestoreJobRepository` with `findByVehicleId` capability.
- Implemented `getAllCustomers` and `getCustomerById` in `CustomerApplicationService` gated behind staff authorization (`['admin', 'workshop_manager', 'service_advisor', 'advisor', 'technician', 'mechanic']`).
- Implemented `listVehiclesForCustomerByStaff` and `getVehicleByIdForStaff` in `VehicleApplicationService`.
- Implemented `listJobsForVehicleByStaff` and `listJobsForCustomerByStaff` in `JobApplicationService`.
- Added exact corresponding REST routes in `internalRoutes.ts`.
- Validated role boundaries ensuring customers cannot access staff APIs (throws 403).

## Verified
- **Routing and Navigation**: Customers route added to StaffShell sidebar.
- **Backend Authorization Integrity**: Enforced SEC-HIGH boundaries. Customers cannot retrieve staff master lists or bypass access controls.
- **Strict Data Identity**: Vehicle `VIN` and `Plate` remain correctly mapped objects. 
- **Tests**: Preserved all prior 63 tests, and added 8 new staff API unit tests in `staffMasterData.test.ts`. Total: 71/71 passed.
- **Code Quality**: Cleaned unused imports and fixed all TypeScript errors (`npm run lint` passing).

## API Gaps
- `GET /api/v1/internal/estimates` (To list estimates for staff)
- `GET /api/v1/internal/invoices` (To list invoices for staff)
- `GET /api/v1/estimates` (To list estimates for customers)
- `JobResponseDto.estimateId` (To automatically link Jobs directly to Estimates)

## Non-Blocking Warnings
- **Standard Vite chunk size warning** exists.
- **Preview Environment Network Errors (Visible Console Errors)**:
  - `429 Too Many Requests`: Caused by the 120-req/min `rateLimiterMiddleware` occasionally blocking Vite's initial dev server module loading.
  - `404 Not Found`: Triggered by a missing `/favicon.ico` request from the browser.

## Deferred Infrastructure
- **Database**: Firestore/Supabase implementation deferred to Antigravity.
- **Authentication**: Firebase Authentication deferred to Antigravity.
- **File Storage**: Deferred to Antigravity.
- **Real-time Notifications**: Deferred to Antigravity.
- **Document Generation**: PDF/Invoice generation deferred to Antigravity.

## Antigravity Fix Queue
- Implement `GET /api/v1/internal/jobs` to list jobs for staff.
- Implement `GET /api/v1/internal/estimates` to list estimates for staff.
- Implement `GET /api/v1/internal/invoices` to list invoices for staff.
- Implement `GET /api/v1/estimates` to list estimates for a logged-in customer.
- Add `estimateId` to `JobResponseDto` to link Jobs directly to Estimates.
- Wire Document Generation securely.
- Connect production Firebase Auth.
- Replace InMemory repositories with Firestore repositories.

## Next Step
Step 5.4 — Proceed to Antigravity production integration or finalize Staff Jobs list dashboard.
