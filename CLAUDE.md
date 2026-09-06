# UAE Automotive Garage — AI Agent Project Context

## Purpose

This file is the shared operating context for AI coding agents working on the UAE Automotive Garage repository.

Treat the repository itself as authoritative. Do not assume previous agent reports are correct without inspecting the code and running verification.

## Current Checkpoint

The current local `main` checkpoint is:

- Commit: `f02b3fc707396ef29d1ddbce61666b0c34b9710b`
- Commit message: `fix(staff): align staff portal with authoritative JobStateMachine`
- Parent: `cf23d60` (`feat: add staff endpoints for all system entities`), which carried the Step 5.4 + Step 5.5 staff operational work.
- This checkpoint contains the committed Step 5.5 staff-side correction.
- `main` is AHEAD of `origin/main` by this commit. It has not been pushed.

### Current phase

Phase 5 — Workshop Execution. Phases 0-4 (governance, public website, customer
portal, commercial core, staff/workshop foundation) are landed. Phase 6
(Scheduling) has NOT been started and must not be started implicitly.

Note on phase numbering: the delivery plan uses numeric phases 0-9. The
"Proposed Forward Roadmap" section further down uses an older lettered A-H
scheme and is retained only as planning material. When the two disagree, the
numeric plan wins.

### Phase 5 status

Phase 5 job-lifecycle work is CLOSED as of this checkpoint (Step 5.5
correction in `f02b3fc`; Step 5.6 closure is the commit that introduced this
file — `git log --oneline -1 -- CLAUDE.md`). Both portals read the
lifecycle from one authoritative module and drift is now compile-checked.

Phase 5 closing did NOT clear the repository. See "Known Technical Debt" — in
particular item 0, a P0 authentication fail-open that blocks any production
deploy, and item 4, a probable break in the customer estimate-approval flow.
Neither is a job-lifecycle issue; neither was in scope here; both outrank new
feature work.

Never overwrite or reset existing work merely to make the tree look cleaner. Inspect `git status`, `git log`, and the diff first.

## Product Scope

The product is a UAE automotive garage platform with:

1. Public website
2. Customer portal
3. Staff/workshop portal
4. ERP/workshop operations progressively added behind the same backend/domain

The architecture must remain ERP-ready even while the website and customer experience are still being developed.

## Architecture Boundary

The intended dependency direction is:

```text
React UI
  ↓
Frontend API/service layer (ApiClient)
  ↓
Express REST API
  ↓
Application Services
  ↓
Domain
  ↓
Repository Interfaces
  ↓
Infrastructure (Mock / Firestore)
```

Frontend MUST NOT directly access:

- Firestore
- Firebase Admin
- Supabase
- repository implementations
- persistence infrastructure
- ERP database internals

Backend authorization is the real security boundary. Frontend role checks are UX only.

## API Client Rule

The frontend `ApiClient` already prepends `/api/v1`.

Therefore frontend callers use paths such as:

```text
/internal/jobs
/internal/jobs/:id
/internal/estimates
/internal/invoices
```

Never create `/api/v1/api/v1/...` by duplicating the prefix.

## Roles

Current application roles:

```text
admin
workshop_manager
service_advisor
advisor
technician
mechanic
```

### Guards

`workshopStaffGuard` permits all six roles.

`commercialStaffGuard` permits:

```text
admin
workshop_manager
service_advisor
advisor
```

Technicians/mechanics must not generate invoices or record payments. Existing tests cover this separation.

The current Step 5.5 implementation allows all six workshop roles to advance job stages. Do not silently narrow this policy during unrelated work; treat any RBAC change as an explicit business/security decision.

## Authoritative Job State Machine

The domain states are exactly:

```text
intake_checkin
inspection_in_progress
estimate_pending
repair_in_progress
quality_control
ready_for_delivery
delivered
```

Legal transitions:

```text
intake_checkin
  → inspection_in_progress

inspection_in_progress
  → estimate_pending

estimate_pending
  → repair_in_progress
  → ready_for_delivery

repair_in_progress
  → quality_control

quality_control
  → repair_in_progress
  → ready_for_delivery

ready_for_delivery
  → delivered

delivered
  → terminal
```

`JobStateMachine` is authoritative.

Invalid transitions MUST fail in the backend/domain even when the UI hides invalid actions.

### Lifecycle consistency rule (staff + customer portals)

There is exactly ONE ordered lifecycle representation in this repository:

```text
src/domain/stateMachines/JobStateMachine.ts
  - JobStage                  (the type)
  - ORDERED_JOB_STAGES        (display/timeline ordering)
  - JobStateMachine.getStageIndex(stage)
  - JobStateMachine.getLegalNextStages(stage)   (UI affordances only)
  - JobStateMachine.assertTransition(from, to)  (authoritative enforcement)
```

Every consumer — staff portal, customer portal, and frontend API types — MUST
derive from that module. Do not redeclare a stage array, a transition table, or
a stage string union anywhere else, in UI code or in `src/types/api.ts`.

This module is frontend-safe: it imports only `DomainError.ts`, which has no
imports at all, so it carries no Node/server-only behavior into the browser
bundle. Importing it from UI code does NOT violate the architecture boundary.

`src/tests/jobLifecycleConsistency.test.ts` enforces this. It walks the source
tree (it does NOT use an allowlist, so new pages are covered automatically) and
fails on: any array literal outside the domain holding 2+ real stage values
under any identifier name; any `.stage === '...'` comparison against a value
that is not a `JobStage`; and any non-relative import appearing in the
lifecycle module's transitive closure.

### Canonical DTO decision (recorded 2026-09-06)

`src/application/dto/AppDtos.ts` is the SOLE source of wire DTOs. It is what
every `*ApplicationService.toDto()` returns.

`src/types/api.ts` is LEGACY and slated for deletion. It duplicates six
interface names and all six disagree with `AppDtos.ts` — most dangerously
`EstimateResponseDto.totalFils`, which means grand total in one and subtotal in
the other. Only `AuthContextDto` still has a consumer. Do not add to it, do not
import DTOs from it, and move `AuthContextDto` out when convenient. The
lifecycle test deliberately does NOT require this file to exist, so deleting it
will not fail the suite.

## Authoritative Estimate State Machine

Statuses are exactly:

```text
draft
pending_customer_decision
partially_approved
approved
rejected
locked
```

Legal transitions:

```text
draft
  → pending_customer_decision

pending_customer_decision
  → partially_approved
  → approved
  → rejected

partially_approved
  → locked

approved
  → locked

rejected
  → locked

locked
  → terminal
```

Do not invent statuses such as `sent` unless the domain is deliberately changed.

## Current Staff APIs

Important staff routes include:

```text
GET  /api/v1/internal/jobs
GET  /api/v1/internal/jobs/:id
POST /api/v1/internal/jobs/:id/stage
GET  /api/v1/internal/estimates
GET  /api/v1/internal/invoices
```

Commercial mutation routes remain protected by the narrower commercial-staff guard.

## Customer Ownership / Security

Customer-owned data must be protected by backend ownership checks.

`AuthorizationGuard.assertCustomerOwnsEntity` is part of the BOLA/IDOR boundary.

Customers must not be able to:

- access staff/internal routes
- read another customer's vehicles/jobs/estimates/invoices
- advance workshop job stages
- create invoices or record payments

Authentication must be enforced server-side.

## DTOs / Important Fields

### CustomerResponseDto

- id
- fullName
- email
- phone
- emirate
- preferredLanguage
- createdAt

### VehicleResponseDto

- id
- customerId
- vin
- plate `{ emirate, code, number, displayString }`
- make
- model
- year
- color
- odometerReadingKm
- createdAt

### JobResponseDto

- id
- customerId
- vehicleId
- stage
- serviceAdvisorName
- assignedTechnician?
- customerConcern
- diagnosticSummary
- mileageInKm
- estimatedCompletionAt?
- createdAt
- updatedAt

Note: current `JobResponseDto` does not include `estimateId` unless deliberately changed later.

### EstimateResponseDto

- id
- jobId
- customerId
- version
- parentEstimateId?
- status
- items
- subtotalFils
- vatFils
- totalFils
- display fields
- approvedTotalFils / approved display
- isActionable
- isLocked
- createdAt
- lockedAt?

### InvoiceResponseDto

- id
- jobId
- customerId
- estimateId
- estimateVersion
- approvalId
- status
- subtotalFils
- vatFils
- totalFils
- display fields
- taxRegistrationNumber?
- supplierName?
- customerName?
- dateOfSupply?
- items?
- recordedByStaffId?
- paymentMethod?
- issuedAt
- paidAt

## Repository Layer

Current repositories include interfaces and infrastructure implementations for customers, vehicles, jobs, estimates, and invoices.

`IJobRepository` supports operations such as:

- findById
- findByCustomerId
- findByVehicleId
- findActiveByCustomerId
- listAll
- save
- update

`IEstimateRepository` and `IInvoiceRepository` include `listAll` for internal staff views.

Firestore global lists currently use unpaginated collection reads. Treat this as known technical debt; do not introduce pagination in an unrelated feature pass unless needed.

## Existing Customer Routes

Current customer routes include:

```text
GET   /api/v1/customers/profile
PATCH /api/v1/customers/profile
GET   /api/v1/vehicles
GET   /api/v1/vehicles/:id
POST  /api/v1/vehicles
PATCH /api/v1/vehicles/:id/mileage
GET   /api/v1/jobs
GET   /api/v1/jobs/:id
```

Ownership is enforced in the backend.

## Step History

Completed work to date:

### Step 3.7.1 — Backend / Security Baseline

- backend/security baseline established
- 63/63 tests at that checkpoint

### Step 4.1 — Frontend Foundation

- base frontend structure and API integration

### Step 4.2 — Public Website

- public-facing website implementation

### Step 4.3 — Customer Portal

- customer portal initial implementation

### Step 4.4 — Customer Portal Completion

- customer portal integration/completion work

### Step 5.1 — Staff Foundation

- staff authentication/portal foundation

### Step 5.2 — Estimate / Invoice Commercial Workflows

- estimate workflow
- approval/invoice foundations
- commercial authorization rules
- idempotency/concurrency/security coverage

### Step 5.3 — Customer / Vehicle Master + Workshop Context

- internal staff access to customer/vehicle/master data

### Step 5.4 — Staff Operational Control Center

- internal lists/dashboard
- operational staff views
- dynamic dashboard metrics

### Step 5.5 — Staff Job Operations / Workshop Execution

- staff job detail route
- job operational read
- stage advancement
- legal state transitions
- deep links to related customer/vehicle records
- security tests for staff job operations

## Step 5.5 Correction Context

Known correction items from the latest review:

1. Dashboard previously used invalid literals such as `intake`, `inspection`, `qc`, and `sent`.
2. Dashboard invoice fetching was unused.
3. `StaffJobDetailPage` previously duplicated job stages and legal transitions.
4. `backup_StaffDashboardPage.tsx` was an accidental tracked artifact.
5. The correction pass moved the staff job UI to the domain `JobStateMachine` accessor for legal transitions.
6. The correction pass removed the unused dashboard invoice request.
7. The correction pass removed the accidental backup file.
8. Tests: 86/86 passed after the correction.
9. Type check/lint: passed.
10. Production build: passed with one non-blocking Vite chunk-size warning (>500 kB).

Status: this correction was reviewed and committed as `f02b3fc`. Tests were
86/86 at that checkpoint.

### Step 5.6 — Phase 5 Job Lifecycle Closure (in tree, UNCOMMITTED)

Closes the customer-side half of the same lifecycle drift that Step 5.5 fixed on
the staff side.

1. `src/app/routes/portal/JobDetailPage.tsx` declared its own 8-entry `STAGES`
   array containing four states that do not exist in the domain (`inspection`,
   `approved`, `in_progress`, `qc_testing`). It now consumes
   `ORDERED_JOB_STAGES` and `JobStateMachine.getStageIndex`.
2. `src/types/api.ts` declared an inline stage union
   (`received | inspecting | estimating | awaiting_approval | in_progress | qc | ready | delivered`)
   in which 7 of 8 values were invalid. It now uses `JobStage` via a type-only
   import from the domain module.
3. Two staff stage labels used `.replace('_', ' ')`, which replaces only the
   first underscore and rendered `inspection_in_progress` as
   "inspection in_progress". Both now use `.replace(/_/g, ' ')`.
4. `src/application/dto/AppDtos.ts` typed `stage` as a bare `string`. It is now
   `JobStage`. THIS is the change that creates real protection: `tsc` now
   rejects a fictional stage comparison (verified — injecting `'qc_testing'`
   produces TS2367, exit 2). The earlier `src/types/api.ts` typing was applied
   to a module nothing imports and was inert on its own.
5. `src/app/routes/portal/ServiceHistoryPage.tsx` compared `job.stage` against
   `'cancelled'`, which is an `AppointmentStatus`, not a `JobStage`. Removed.
6. Three surfaces rendered `{job.stage}` raw (underscores visible to users):
   `ServiceHistoryPage`, `StaffCustomerDetailPage`, `StaffVehicleDetailPage`.
   All now use `.replace(/_/g, ' ')`, matching the other six render sites.
7. Removed the customer inspection-report download. It could never succeed: it
   passed a JobId where `DocumentAccessApplicationService` resolves an
   `InspectionReportId`, and hardcoded a `documentKey` that must be a member of
   `inspection.findings[].mediaStorageKeys`. Correcting the stage index had
   widened its exposure from 3 stages to 5. See debt #6 to restore it properly.
8. Added `src/tests/jobLifecycleConsistency.test.ts` (9 tests) as a standing
   drift guard. An earlier version was defeated by simply renaming the offending
   array; the current version is name-agnostic and walks the tree. Both bypasses
   were re-run against it and now fail correctly.

This step was verified by a five-agent parallel audit (domain, security,
architecture, test quality, hygiene). The audit found the first draft of the fix
insufficient; items 4-8 above exist because of it.

Impact before the fix: `indexOf(job.stage)` returned `-1` for three of the seven
real stages (`inspection_in_progress`, `repair_in_progress`, `quality_control`),
so the customer timeline highlighted no current step and suppressed the
inspection report download for customers whose jobs were mid-repair.

## Known Technical Debt / Drift Risks

These items are known and should not be silently fixed during unrelated work:

RELEASE BLOCKER (P0) — not a Phase 5 item, but must be fixed before ANY
production deploy:

0. **Authentication fails open to mock.** `FirebaseConfig.getProvider()` returns
   `'firebase'` only when `INFRASTRUCTURE_PROVIDER` is exactly that string, and
   `'mock'` otherwise — with no production guard. Mock mode installs
   `MockAuthTokenVerifier`, whose hardcoded `test-token-staff-manager` grants
   `['workshop_manager','admin']`. That token string ships in the client bundle
   and `AuthProvider.tsx:62` has a button that sends it. A deploy with the env
   var unset or misspelled gives any visitor full admin. Fix: hard-fail startup
   when environment is production and the resolved provider is `mock`, and strip
   the dev-login affordance from production builds. `GET /api/health` also
   returns `mode`, handing an attacker the exact signal.

Phase 5 lifecycle items — RESOLVED:

1. RESOLVED — `src/types/api.ts` stage union now derives from `JobStage`.
2. RESOLVED — `portal/JobDetailPage.tsx` no longer hardcodes a lifecycle array.
3. RESOLVED — `AppDtos.ts` stage is `JobStage`, so drift is compile-checked.

Open items, highest value first:

4. **`portal/EstimateDetailPage.tsx` gates on a status the domain cannot
   produce.** It checks `status === 'draft' || status === 'pending'`, but the
   actionable value is `pending_customer_decision`. So `isDraftOrPending` is
   false for every actionable estimate and `handleToggleItem` early-returns —
   customers likely cannot select line items to approve or reject. The server
   already sends the correct answer as `EstimateResponseDto.isActionable`; the
   page ignores it. Same defect class as the JobStage drift, in the estimate
   lifecycle. This is Phase 3 scope, deliberately NOT fixed in the Phase 5
   checkpoint, and is probably the most user-visible bug currently known.
5. `src/types/api.ts` is otherwise dead code and should be deleted — see the
   canonical DTO decision above. Its `EstimateResponseDto.status` also
   advertises `pending_review`, which is not a valid `EstimateStatus`.
6. Customer inspection-report download is removed pending an API that exposes a
   job's inspection id and media keys. `IInspectionRepository.findByJobId`
   exists but no HTTP route reaches it. `jobRoutes.ts` JSDoc still falsely
   claims the job endpoint returns inspection findings.
7. **No runtime validation of `stage` at the I/O boundary.**
   `JobFirestoreMapper` does an unchecked `doc.stage as JobStage`, and
   `internalRoutes.ts` casts `targetStage as JobStage`. Writes fail closed
   (unknown stage has no legal transitions), but a legacy row hydrates into a
   job whose timeline shows no current step and whose staff page reads
   "This job has reached its terminal stage" — i.e. permanently unadvanceable.
   Add an `isJobStage()` guard in the mapper. The lifecycle test pins the
   degradation behaviour but cannot prevent the bad data arriving.
8. `job` is `any` on both job-detail pages (`useApi<{ job: any }>`), which
   defeats the new compile-time barrier on exactly the two pages that matter.
9. Timeline is a linear `index <` model, so on the legal
   `estimate_pending -> ready_for_delivery` path (customer declines repairs) it
   paints `repair_in_progress` and `quality_control` as completed — telling the
   customer work happened that did not. Faithfully representing this needs the
   stage-transition history; `JobStageChangedEvent` already exists as a source.
10. `GET /internal/estimates` and `/internal/invoices` use `workshopStaffGuard`,
    so technicians/mechanics can read the whole commercial ledger. The write
    split is correct; this read split is a least-privilege violation.
11. No endpoint registry: ~40 endpoint paths are inline string literals, several
    duplicated across pages. The "never duplicate the /api/v1 prefix" rule is
    enforced by nothing.
12. The six-role list is duplicated 4x in UI and 8x+ server-side.
13. `bun.lock` IS tracked, but `package.json` scripts run under npm and there is
    no `packageManager` field — so `npm install` ignores the lockfile and
    installs are effectively unpinned. (Supersedes the earlier, incorrect claim
    that no lockfile existed.)
14. Firestore `listAll` operations are unpaginated.
15. Vite reports a main-chunk size warning around 503 kB after minification.
16. Seven stray files at repo root (`check-*.js`, `diff.patch`) are tracked and
    type-checked by `tsc`. `StaffEstimateDetailPage.tsx:45-48` contains leftover
    agent reasoning as comments.
17. Dev server binds `0.0.0.0` with Vite in middleware mode, so backend source
    is readable over the network in dev.

Do not bundle these into unrelated feature work without explicit scope.

## Engineering Workflow

For every new milestone:

1. Establish the current checkpoint.
2. Read relevant existing code before editing.
3. Identify domain/state/authorization rules before touching UI.
4. Make the smallest bounded implementation that fits the architecture.
5. Add or update tests for changed business/security behavior.
6. Run the full available verification suite.
7. Inspect the final diff for unrelated changes.
8. Commit a clean checkpoint.
9. Only then begin the next milestone.

When taking over from another agent, behave as a fresh reviewer rather than trusting the prior agent's summary.

## Verification Standard

At minimum, use the repository's actual scripts, typically:

```bash
npm test
npm run lint
npm run build
```

Do not report "clean" when warnings remain.

Distinguish clearly between:

- test failures
- lint/type errors
- build failures
- non-blocking warnings
- known technical debt

## Proposed Forward Roadmap

The following is a BASE ROADMAP for future planning, not a claim that these milestones are already implemented or formally approved.

### Phase A — Stabilize the Existing Checkpoint

- DONE — Step 5.5 correction committed as `f02b3fc`
- DONE — stage-type drift resolved in Step 5.6 (uncommitted at time of writing)
- OPEN — `origin/main` is not yet aligned; `main` is ahead and unpushed
- OPEN — retire the dead duplicate DTOs in `src/types/api.ts` (see debt #3/#4)

### Phase B — Customer Journey Completion

- verify customer job visibility against live staff workflow
- surface estimate/approval lifecycle correctly
- connect invoices/payment status to the customer journey
- validate end-to-end customer ownership/security

### Phase C — Workshop Job Execution

- diagnostic updates
- technician assignment workflow
- job notes / execution history
- inspection and quality-control operational data
- workshop-ready status transitions and audit history

### Phase D — Appointments / Scheduling

- appointment lifecycle
- workshop capacity/context
- advisor scheduling
- check-in / intake linkage to jobs

### Phase E — Parts / Inventory

- parts catalogue
- stock levels
- job-to-part consumption
- suppliers / procurement foundations
- inventory controls and auditability

### Phase F — Finance / Commercial Expansion

- invoice lifecycle hardening
- payments and reconciliation
- customer balances / credits where required
- tax/commercial reporting foundations

### Phase G — ERP Control Plane

- unified staff control center
- operational reporting
- audit logs
- permissions refinements
- pagination/search/filtering at scale
- production observability

### Phase H — Production Hardening

- real Firestore production wiring where still mocked
- performance and query review
- error handling / monitoring
- deployment/runtime configuration
- backups/recovery
- security review
- end-to-end acceptance checks

Each future phase should first be converted into a bounded ROCD implementation prompt before coding begins.

## Critical Agent Rules

- Do not create a second source of truth for domain state transitions.
- Do not trust frontend authorization as security.
- Do not let the frontend talk directly to persistence.
- Do not invent domain statuses because they sound convenient.
- Do not expand scope merely because nearby code could be improved.
- Do not commit or push unless explicitly instructed.
- Before reporting success, inspect the actual diff and verification output.
- Prefer evidence over assumptions.
- Audit before implementing. Before starting any new milestone, re-establish the
  checkpoint (`git status`, `git log`, `git rev-parse HEAD`), read the code you
  are about to change, and confirm the "Known Technical Debt" list still matches
  reality. Do not trust this file, or a previous agent's report, over the
  repository itself.
- Keep this file honest. When you land or revise a checkpoint, update "Current
  Checkpoint", the step history, and the technical debt list in the same pass.
  A stale governance file is worse than none.
