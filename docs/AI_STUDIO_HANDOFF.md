# AI Studio Handoff

## Current Milestone

Step 4.4 — Customer Portal Completion

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

## Current Implementation

- **Portal Shell**: AppShell configured with sidebar navigation protecting portal routes.
- **Authentication**: Fully working development token flow using `test-token-alice` through MockAuthTokenVerifier.
- **Dashboard (`/portal`)**: Overview of active vehicles, active jobs, upcoming appointments, and unread notifications.
- **Vehicles (`/portal/vehicles`)**: Listing vehicles and providing a form to register new vehicles.
- **Appointments (`/portal/appointments`)**: Full UX to list, schedule (book new), and cancel appointments.
- **Jobs / Active Repairs (`/portal/jobs`)**: Listing active repair jobs.
- **Job Details (`/portal/jobs/:id`)**: Displaying timeline status, diagnostics, and inspection document access.
- **Service History (`/portal/history`)**: Lists all past and active jobs (representing service history).
- **Estimates (`/portal/estimates`)**: Empty state showing API Gap (no endpoint to list estimates by customer).
- **Estimate Approval (`/portal/estimates/:id`)**: Review, selectively approve/reject line items, and submit an authoritative decision.
- **Invoices (`/portal/invoices`)**: List of customer invoices with status, amounts, and document download capabilities.
- **Notifications (`/portal/notifications`)**: Display customer notifications, marking them as read.
- **Profile (`/portal/profile`)**: Manage personal information (name, phone, emirate).

## Verified

- **Routing and Navigation**: Full customer portal routes exist and are functional.
- **API Fetching**: Used `ApiClient` mapping natively to `/api/v1/` routes.
- **Security Boundary**: The frontend does not access the backend domain or mock repositories directly. 
- **Empty & Loading States**: Clean empty and loading states throughout.

## Known Issues

- **BLOCKER**: None.
- **NON-BLOCKING**: Missing Estimate listing endpoint prevents populating the Estimates page dynamically.
- **DEFERRED**: Document PDFs (`/api/v1/documents/access-url` returns a stub valid URL but we treat it as deferred on the UI via `DocumentDownloadButton`).

## Non-Blocking Warnings

- Standard Vite chunk size warning exists.

## API Gaps

- **Estimate List Endpoint**: The `EstimateApplicationService` and `estimateRoutes.ts` lack an endpoint to list estimates for a customer (e.g., `GET /api/v1/estimates`). The `EstimatesPage` gracefully shows an error banner indicating this gap.
- **Job Details Estimate ID**: `JobResponseDto` does not include the active `estimateId`, so we cannot automatically direct the user from the job to its estimate.

## Deferred Infrastructure

- **Database**: Firestore/Supabase implementation deferred to Antigravity.
- **Authentication**: Firebase Authentication deferred to Antigravity.
- **File Storage**: Deferred to Antigravity.
- **Real-time Notifications**: Deferred to Antigravity.

## Antigravity Fix Queue

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

Step 5.1 — Workshop / Staff Portal Foundation.
