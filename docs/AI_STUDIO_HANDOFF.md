# AI Studio Handoff

## Current Milestone
Step 5.2 — Staff Estimate & Invoice Commercial Workflows (Completed & Audited)

## Project Architecture
- **Frontend**: React 19, React Router, Vite, Tailwind CSS v4, Lucide React, Shadcn/ui
- **Backend**: Express (embedded using Vite middleware in dev, bundled via esbuild for prod), RESTful endpoints, Domain-Driven Design
- **Persistence**: InMemory repositories (Deferred to Firestore via Antigravity)
- **Auth**: Token-based middleware using mock verifier (Deferred to Firebase Auth via Antigravity)
- **Communication**: Frontend communicates with backend EXCLUSIVELY via `ApiClient` through REST API endpoints.

## Completed & Audited Work
- Created `StaffEstimateCreatePage` utilizing `POST /internal/estimates` to build drafts respecting integer-fils payload limits.
- Created `StaffEstimateDetailPage` utilizing `GET /estimates/:id` displaying immutable line items, exact monetary conversion outputs, and customer decision tracking.
- Created `StaffInvoicesPage` and `StaffEstimatesPage` list foundation displaying clear API-gap boundaries.
- Created `StaffInvoiceDetailPage` utilizing `GET /invoices/:id` with balance summaries and protected payment-recording features via `POST /internal/invoices/:id/record-payment`.
- **(NEW)** Created `StaffInvoiceCreatePage` utilizing `POST /internal/invoices/generate` via `approvalId` to adhere exactly to the backend contract for generating an invoice.
- **(NEW)** Removed all duplicated `/api/v1` prefixes and incorrect `.data` object-wrapping bugs on API client responses.
- Implemented `StaffCapabilities.ts` tracking exact backend authorization roles (`admin`, `workshop_manager`, `service_advisor`, `advisor`) mapped to explicit UI capabilities (`estimates:create`, `estimates:submit`, `invoices:generate`, `payments:record`).

## Verified
- **Routing and Navigation**: Full commercial workflow routes added correctly to `router.tsx` and StaffSidebar.
- **Backend Authorization Integrity**: Validated roles explicitly matching `commercialStaffGuard` constraints.
- **Strict Role Boundaries**: Technicians and Mechanics do not receive payment or invoice generation controls.
- **Monetary Inputs**: The frontend creates estimates using `Math.round(Number(value))` to ensure all commercial payload attributes (`unitPriceFils`) are pushed upstream as exact integers to prevent backend float rejection/tampering issues.

## Commercial workflow coverage
- **Implemented**: `estimates:create`, `estimates:submit`, `invoices:generate`, `payments:record` (UI flows implemented)
- **API-supported**: `POST /internal/estimates`, `POST /internal/estimates/:id/submit`, `POST /internal/invoices/generate`, `POST /internal/invoices/:id/record-payment`, `GET /estimates/:id`, `GET /invoices/:id`
- **API-gap**: `GET /api/v1/internal/estimates` (List view), `GET /api/v1/internal/invoices` (List view), `JobResponseDto.estimateId`
- **Deferred**: External payment gateways, document generation.

## Security
- **Staff/Customer Separation**: `AppShell` (portal) and `StaffShell` strictly separated.
- **Role-Aware Financial Controls**: Only Commercial Staff can see and submit estimates and record payments. `hasCapability` strictly guards UI mounting.
- **Backend Authority**: Frontend respects the backend integer-fils limits and never calculates authoritative final balances, rendering exactly what the `InvoiceResponseDto` provides.

## Financial integrity
- **Integer Fils**: The UI correctly intercepts floats and builds an integer payload using strict mathematical conversion before `ApiClient` fires.
- **Authoritative Backend Totals**: Displays mapped directly to the DTO's `*Display` payload fields (e.g., `invoice.totalDisplay`).
- **Duplicate Invoice Protection**: Handled at the backend via idempotency and status validation on `issued`. Form disables safely on submit.
- **State Transitions**: The estimate/invoice badges strictly mirror backend state (`draft`, `approved`, `locked`, `issued`, `paid`).

## API Gaps
- `GET /api/v1/internal/estimates` (To list estimates for staff)
- `GET /api/v1/internal/invoices` (To list invoices for staff)
- `GET /api/v1/estimates` (To list estimates for customers)
- `JobResponseDto.estimateId` (To automatically link Jobs directly to Estimates)

## Non-Blocking Warnings
- **Standard Vite chunk size warning** exists.
- **Preview Environment Network Errors (2 Visible Console Errors)**:
  - `429 Too Many Requests`: Caused by the 120-req/min `rateLimiterMiddleware` occasionally blocking Vite's initial dev server module loading (which fetches hundreds of ESM chunks). (ENVIRONMENT / PREVIEW)
  - `404 Not Found`: Triggered by a missing `/favicon.ico` request from the browser. (ENVIRONMENT / PREVIEW)

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
Step 5.3 — Next Workshop/ERP module (Customers/Vehicles Fleet tracking) OR proceed to Antigravity production integration.
