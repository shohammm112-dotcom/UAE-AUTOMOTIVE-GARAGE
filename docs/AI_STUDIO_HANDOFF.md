# AI Studio Handoff

## Current Milestone

Step 5.1 — Workshop / Staff Portal Foundation

## Project Architecture

- **Frontend**: React 19, React Router, Vite, Tailwind CSS v4, Lucide React, Shadcn/ui
- **Backend**: Express (embedded using Vite middleware in dev, bundled via esbuild for prod), RESTful endpoints, Domain-Driven Design
- **Persistence**: InMemory repositories (Deferred to Firestore via Antigravity)
- **Auth**: Token-based middleware using mock verifier (Deferred to Firebase Auth via Antigravity)
- **Communication**: Frontend communicates with backend EXCLUSIVELY via `ApiClient` through REST API endpoints.

## Completed Milestones

- Step 3.7.1 — Backend migration/security baseline
- Step 4.1 — Frontend foundation
- Step 4.2 — Public website
- Step 4.3 — Customer portal
- Step 4.4 — Customer portal completion (Notifications, Documents, Profile, Service History, Appointments UX)
- Step 5.1 — Workshop / Staff Portal Foundation

## Current Implementation

- **Staff Shell**: `StaffShell` configured with a dedicated operations-style sidebar, role-based capability awareness, and protective navigation redirects keeping customers out of `/staff`.
- **Staff Authentication**: Expanded development login to support "Service Advisor" and "Workshop Manager" mock identities directly from `/login`.
- **Workshop Dashboard (`/staff/dashboard`)**: Operational board with metrics. (Deferred state shown for lists).
- **Job Queue (`/staff/jobs`)**: Filterable job list placeholder (API gap shown cleanly).
- **Staff Job Detail (`/staff/jobs/:id`)**: Authorized staff view of the job. Utilizes the existing GET `/api/v1/jobs/:id` (which `AuthorizationGuard` correctly permits for staff). Includes full UX to advance the job stage using `POST /api/v1/internal/jobs/:id/stage`.
- **Estimate Queue (`/staff/estimates`)**: Foundation route created with API gap visibility.
- **Role Awareness**: The UI conditionally checks `user.roles` to show/hide stage advancement buttons and role badges appropriately, strictly as a UX layer on top of the robust backend authorization.

## Verified

- **Routing and Navigation**: Full staff portal foundational routes exist and are functional.
- **API Fetching**: Used `ApiClient` mapping natively to `/api/v1/internal` and `/api/v1/` routes.
- **Security Boundary**: The frontend does not access the backend domain or mock repositories directly. Backend `AuthorizationGuard` successfully protects the internal stage advancement route.
- **Empty & Loading States**: Clean empty and loading states throughout.

## Known Issues

- **BLOCKER**: None.
- **NON-BLOCKING**: Missing Internal Listing endpoints prevent populating the Staff Job Queue and Estimate Queue dynamically.
- **NON-BLOCKING**: Missing Customer Listing endpoints prevent populating customer/estimates endpoints dynamically.

## Non-Blocking Warnings

- **Standard Vite chunk size warning** exists.
- **Preview Environment Network Errors (2 Visible Console Errors)**:
  - `429 Too Many Requests`: Caused by the 120-req/min `rateLimiterMiddleware` occasionally blocking Vite's initial dev server module loading (which fetches hundreds of ESM chunks). (ENVIRONMENT / PREVIEW)
  - `404 Not Found`: Triggered by a missing `/favicon.ico` request from the browser. (ENVIRONMENT / PREVIEW)

## API Gaps

- **Internal Job List Endpoint**: There is no `GET /api/v1/internal/jobs` endpoint to list all jobs for the workshop queue.
- **Internal Estimate List Endpoint**: There is no `GET /api/v1/internal/estimates` endpoint to list all estimates for the workshop queue.
- **Customer Estimate List Endpoint**: The `EstimateApplicationService` and `estimateRoutes.ts` lack an endpoint to list estimates for a customer (e.g., `GET /api/v1/estimates`). 
- **Job Details Estimate ID**: `JobResponseDto` does not include the active `estimateId`, so we cannot automatically direct the staff/customer from the job to its estimate.

## Deferred Infrastructure

- **Database**: Firestore/Supabase implementation deferred to Antigravity.
- **Authentication**: Firebase Authentication deferred to Antigravity.
- **File Storage**: Deferred to Antigravity.
- **Real-time Notifications**: Deferred to Antigravity.

## Antigravity Fix Queue

- Implement `GET /api/v1/internal/jobs` to list jobs for staff.
- Implement `GET /api/v1/internal/estimates` to list estimates for staff.
- Implement `GET /api/v1/estimates` to list estimates for a logged-in customer.
- Add `estimateId` to `JobResponseDto` to link Jobs directly to Estimates.
- Wire Document Generation securely.
- Connect production Firebase Auth.
- Replace InMemory repositories with Firestore repositories.

## Provider Integration
Deferred

## Backend Changes
NONE

## Current Validation

- npm test: 63/63 PASSED (0 FAILED)
- npm run lint: PASSED
- npm run build: PASSED

## Next Step

Step 5.2 — Staff Estimate & Invoice Commercial Workflows.
