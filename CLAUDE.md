# UAE Automotive Garage — AI Agent Project Context

## Purpose

This file is the shared operating context for AI coding agents working on the UAE Automotive Garage repository.

Treat the repository itself as authoritative. Do not assume previous agent reports are correct without inspecting the code and running verification.

## Current Checkpoint

The current local `main` checkpoint is:

- Commit message: `feat: add demo fixture and close the invoice approval gap`
  (find it with `git log --oneline -1`)
- Lineage: `5b7d26f` (Phase 6.1) -> `72b37fb` (Phase 6.2) -> `afe3d01` (6.1
  security follow-up: vehicle ownership on booking) -> this checkpoint.
- This checkpoint is DEMO PREPARATION, not a new phase. It adds a development-only
  demo fixture, closes the invoice approval-id gap that broke the customer ->
  payment chain in the UI, and fixes a live field-name bug on the vehicles page.
- Verification at this checkpoint: `npm test` 164/164 (exit 0), `npm run lint`
  exit 0, `npm run build` exit 0 with one pre-existing non-blocking Vite
  chunk-size warning (~507 kB). See debt #15.

### Demo fixture

`src/infrastructure/mock/DemoSeed.ts`, invoked from `server.ts`. Double-gated:
`!RuntimeEnvironment.isProduction()` AND `container.mode === 'mock'`, behind a
dynamic import so it cannot reach a production artifact. Opt out with
`DEMO_SEED=false`. Idempotent, and it resets on every restart so the demo can be
rehearsed repeatedly from a clean state.

It reproduces a real client invoice (AutoGuru INV260526412) — Sanjeev Bhatia,
Nissan Patrol Super Safari 2022, VIN JN8FY1NY5NX100590, plate Dubai I 85504,
61,323 km — with the job seeded MID-FLOW at `estimate_pending` and an estimate
awaiting the customer's decision, so the demo performs approval, workshop
progression, invoicing and payment live.

Verified end to end over HTTP: approval -> estimate locks -> approval id resolves
-> four job stage transitions -> invoice issued (subtotal AED 4,168.11, VAT
208.41, total 4,376.52, TRN present) -> payment recorded as paid.

### Current phase

Phase 5 — Workshop Execution — is CLOSED. Phases 0-4 (governance, public
website, customer portal, commercial core, staff/workshop foundation) are
landed.

Phase 6.1 — Appointment Domain Hardening — is CLOSED (`5b7d26f`).
Phase 6.2 — Staff Appointment Operations — is CLOSED (this checkpoint).

Phase 6.3+ has NOT been started and must not be started implicitly. Still
deliberately absent: capacity model, bays, technician availability, working
hours, calendar/slot-search UI, notifications, appointment-to-Job creation
(#36), check-in, and booking-concurrency control (#38).

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

## Production vs Mock Authentication (security boundary)

`src/infrastructure/config/RuntimeEnvironment.ts` is the SOLE authority for
whether the process is production. Do not re-derive this from `process.env`
anywhere else.

```text
isProduction() = NODE_ENV/APP_ENV in {production, prod}
                 OR PRODUCTION_ARTIFACT === 'true'   (baked in by `npm run build`)
```

Rules:

- Production MUST NOT resolve to mock infrastructure. `createApplicationContainer`
  throws when it would, which exits the process non-zero via the `startServer`
  catch in `server.ts`. Failing to boot is the intended behaviour.
- `MockAuthTokenVerifier` cannot be constructed in production, by any path.
- Mock authentication remains fully available for development and tests. The
  opt-in is simply the absence of a production signal, which is why the 25
  container call sites in the test suite required no changes.
- The backend is the security boundary. The frontend cannot manufacture a
  privileged identity: `localStorage.dev_auth_token` is still rehydrated by
  `AuthProvider`, but a production server runs a real Firebase verifier that
  rejects seeded tokens (verified: HTTP 401). UI stripping removes the
  advertisement and the credential; it is defence in depth, not the boundary.
- Production requires `INFRASTRUCTURE_PROVIDER=firebase` AND `ALLOWED_ORIGINS`.
  Both are asserted at startup. `ALLOWED_ORIGINS` is enforced because activating
  real production mode also activates the restrictive CORS branch, which without
  an allowlist rejects every browser request.
- `.env` is now actually loaded (`dotenv/config` in `server.ts`).

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

### Step 5.7 — P0 Authentication + P1 Estimate Approval Remediation

Investigated by five parallel agents (auth fail-open, adversarial security, auth
architecture, estimate approval trace, approval security baseline), then fixed,
then adversarially re-tested. Both issues were REPRODUCED before being fixed.

Delivered:

1. Fail-closed production authentication (see resolved debt item 0).
2. Customer estimate approval restored (see resolved debt item 4).
3. Duplicate `itemId` and invalid `decision` literals now rejected at the service
   boundary. Both were customer-triggerable HIGHs in the endpoint being fixed:
   duplicates desynchronised the approval record from the money (the snapshot
   builder resolved by first match, the domain by last), which could produce a
   TRN-bearing tax invoice itemising one amount while charging another; an
   invalid literal was treated as a silent rejection and locked the estimate
   terminally at zero value.
4. Three fictional `'scheduled'` appointment-status comparisons removed. Found by
   the new drift guard, not by hand. `AppointmentStatus` has no such member, so
   the customer Cancel button never rendered and the dashboard's upcoming list
   was permanently empty. `AppointmentsPage` now asks
   `AppointmentStateMachine.canTransition(status, 'cancelled')`.
5. Removed `item.partNumber` from the estimate page — it exists nowhere in the
   domain or the DTO, so that line always rendered "N/A". Caught by the new DTO
   typing.
6. 26 regression tests across two new suites. Test count 95 -> 120.

Adversarial verification: every guard was reverted one at a time and the suite
re-run, confirming each test fails against the pre-fix behaviour. Two weaknesses
in the drift guards were found this way and fixed — a cast (`(x.status as
string) === 'pending'`) slipped past the regex, and the "consumes isActionable"
check was satisfied by the word appearing in a comment. Both bypasses are now
caught. The tests reproduce the historical failure, not merely the happy path.

NOTE: the four second-wave verification agents (security, commercial, domain,
adversarial) were terminated by an API session limit before returning. Their
checks were performed inline by the lead instead. Treat that verification as
single-source and re-run it independently if you want a second opinion.

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

### Step 6.1 — Appointment Domain Hardening

Closes the appointment foundation: domain-correct, type-safe, validated, secured,
tested. Deliberately NOT a scheduling system.

Delivered:

1. **P0 authorization.** `cancelAppointment` moved from
   `assertCustomerOwnsEntity` (which early-returns for staff) to the existing
   `assertCustomerOnly`. Reproduced before fixing; see resolved debt #30.
2. **Staff routes.** `POST /internal/appointments/:id/confirm` and `.../cancel`
   behind `commercialStaffGuard`. Resolves debt #34; the service role list now
   includes `service_advisor`.
3. **Type safety.** `AppointmentResponseDto.status`/`dropoffType`/
   `preferredTimeSlot` narrowed to domain unions, and — the load-bearing half —
   both portal pages typed as `AppointmentResponseDto[]` instead of `any[]`.
4. **Validation, split deliberately.** Structural checks (real `YYYY-MM-DD`
   calendar date, valid slot, valid dropoff) live in the entity constructor;
   the past-date policy lives ONLY in `requestAppointment`. This split matters:
   `AppointmentFirestoreMapper.toDomain` rehydrates historical appointments
   through that same constructor, so a past-date throw there would make every
   completed appointment unreadable. A regression test pins this.
5. **I/O boundary guards.** The mapper's unchecked `doc.status as
   AppointmentStatus` cast is replaced by `isAppointmentStatus` /
   `isAppointmentTimeSlot` / `isAppointmentDropoffType`. This is the appointment
   twin of debt #7/#25.
6. **Time model** (see "Appointment Time Model" below).
7. **14 regression tests**, 120 -> 134.

Verification: `npm test` 134/134, `npm run lint` exit 0, `npm run build` exit 0
(pre-existing ~501 kB chunk warning, debt #15). A 31-check adversarial script
replayed every pre-fix attack and all are now blocked. Browser-verified with
Playwright: no "Invalid Date", correct date/slot rendering on both surfaces,
Cancel shown only for non-terminal appointments.

Delegation note: the backend was implemented by the local `codex` CLI and the
frontend by the lead. The `hivemind` `codex_task`/`antigravity_task` MCP tools
CANNOT be used for write work — they spawn the CLIs with no approval flags, so
the child blocks on an interactive prompt forever at 0% CPU while appearing to
work. Drive `codex exec --approve-for-me` directly instead.

### Step 6.2 — Staff Appointment Operations

Gives staff an operational surface over the 6.1 foundation.

Delivered:

1. **Staff queue.** `GET /internal/appointments` (optional `?status=` filter)
   behind `workshopStaffGuard`, via the pre-existing
   `IAppointmentRepository.listAll()`. An unknown `status` value is rejected with
   `ValidationFailedError` (400) rather than silently returning everything.
2. **Complete / no-show.** `staffCompleteAppointment` and `staffMarkNoShow`
   plus `POST /internal/appointments/:id/{complete,no-show}`. Closes debt #35 —
   all five `AppointmentStatus` values are now reachable at runtime.
3. **Reschedule.** `Appointment.reschedule(date, slot)` reusing the SAME
   structural validators as the constructor, refusing terminal states, plus
   `staffRescheduleAppointment` and `POST /internal/appointments/:id/reschedule`.
4. **Staff UI.** `src/app/routes/staff/StaffAppointmentsPage.tsx` with status
   filter pills and per-row actions, registered in `router.tsx` and `StaffShell`.
5. **24 regression tests**, 134 -> 158.

Authorization model (deliberate asymmetry):

- **Read is wider than write.** The queue uses `workshopStaffGuard` (all six
  roles, technicians and mechanics included) because a technician needs to see
  the day's schedule. Every mutation stays on the four-role commercial set.
  This is NOT the debt #10 mistake — that concerns the commercial *ledger*,
  where a technician has no business; scheduling is operational data.

Reschedule policy: rescheduling a `confirmed` appointment RESETS it to
`requested`, because a moved slot must be re-confirmed by the workshop; keeping
`confirmed` would assert a commitment nobody made. Rescheduling a `requested`
one leaves it `requested`. Terminal appointments cannot be rescheduled.

The 6.1 validation split is preserved and re-verified: `Appointment.reschedule`
performs structural checks only, and the past-date policy lives in
`staffRescheduleAppointment` via `todayInGst(this.clock())`. A regression test
confirms a past-dated historical appointment still rehydrates through the mapper.

Implementation note: `preferredDate`/`preferredTimeSlot` moved from public
`readonly` fields to private backing fields with getters (TypeScript forbids
reassigning `readonly` outside the constructor). This matches the entity's
existing `_status`/`get status()` idiom; the external read API is unchanged.

Verification: `npm test` 158/158, `npm run lint` exit 0, `npm run build` exit 0
(~507 kB chunk warning, debt #15). Independent 35-check adversarial script:
technicians/mechanics allowed on the queue read but blocked on every mutation,
customers blocked everywhere, unknown status filters rejected, terminal
reschedule refused, malformed and past dates refused, and both 6.1 regressions
(mapper rehydration, technician blocked on the customer cancel route) intact.
Browser-verified: correct rendering, and action buttons exactly mirror
`LEGAL_TRANSITIONS` (5 actions across 2 actionable rows, 3 terminal rows inert).

Delegation note: the frontend was implemented by `agy` on Claude Sonnet 4.6
(Thinking); the backend by a Claude Sonnet subagent after `codex` stalled. See
the tooling note in Step 6.1 — `codex exec` ALSO blocks forever when its stdin
is an open pipe, printing only "Reading additional input from stdin...". Always
redirect `< /dev/null`.

## Appointment Time Model (recorded 2026-09-07)

Explicit, because Phase 6.2+ scheduling depends on it:

- **Timezone assumption**: GST / Asia/Dubai, treated as a FIXED UTC+4 offset.
  The UAE observes no daylight saving. `todayInGst(now)` in
  `AppointmentApplicationService.ts` is the single implementation and takes an
  injectable clock so tests are deterministic.
- **Date representation**: `preferredDate` is a bare `YYYY-MM-DD` calendar day,
  NOT an instant. The UI parses it as UTC when formatting so the rendered day
  never shifts by one in a negative-offset timezone.
- **Time representation**: `preferredTimeSlot` is a coarse enum
  (`morning` | `afternoon` | `evening`), not a clock time. There is deliberately
  no start/end time, because there is no capacity model yet.
- **Validation rules**: structural validity is a domain invariant; "not in the
  past (GST)" is an application policy applied only at request time. Today is
  allowed — a walk-in garage needs same-day booking.

When a real capacity model arrives, the slot enum is the thing that will need to
grow into concrete time ranges. Nothing persists a clock time today, so that
change will not require a data migration.

## Known Technical Debt / Drift Risks

These items are known and should not be silently fixed during unrelated work:

RESOLVED (P0) — authentication fail-open, fixed in this checkpoint:

0. **RESOLVED — authentication no longer fails open to mock.** Previously
   `FirebaseConfig.getProvider()` resolved to `'mock'` for any value of
   `INFRASTRUCTURE_PROVIDER` that was not exactly `firebase`, with no environment
   awareness; mock mode installs `MockAuthTokenVerifier`, whose seeded
   `test-token-staff-manager` grants `['workshop_manager','admin']`. The token
   shipped in the browser bundle and the public `/login` page carried an
   unguarded "Login as Workshop Manager" button. Reproduced end to end, including
   a privileged write (staff stage advancement) by an anonymous caller.

   The fix, and why it takes the shape it does:
   - `src/infrastructure/config/RuntimeEnvironment.ts` is the single authority for
     "is this production?". It is true when `NODE_ENV`/`APP_ENV` says so **or**
     when `PRODUCTION_ARTIFACT` is baked in. The second signal is load-bearing:
     nothing in this repository ever set `NODE_ENV` (not the start script, no
     Dockerfile, no CI), so a guard keyed only on `NODE_ENV` would have been inert
     on exactly the deployment it exists to protect. `npm run build` bakes the
     marker into `dist/server.cjs` via `esbuild --define`, compiling
     `isProductionArtifact()` down to `return true`. **A built artifact therefore
     cannot be talked out of being production** — verified: `NODE_ENV=development`
     and `PRODUCTION_ARTIFACT=false` both still refuse to boot.
   - `container.ts` throws when the resolved mode is `mock` in production. It sits
     **after** `chosenMode` deliberately, because `options.mode` short-circuits
     `getProvider()` — a guard inside `FirebaseConfig` alone would leave that path
     open.
   - `MockAuthTokenVerifier`'s constructor refuses to run in production (defence
     in depth).
   - `server.ts` keys the static-vs-Vite branch on the same authority. Previously
     a built artifact took the dev branch and served its own source tree over
     HTTP, so `/src/infrastructure/mock/MockAuthTokenVerifier.ts` returned 200
     with the admin token in it — an independent second path to admin.
   - `server.ts` now imports `dotenv/config`. `dotenv` was a declared dependency
     imported zero times, so `.env` was never read even though `.env.example` and
     the README told operators to use one. Following the repo's own setup
     instructions produced the vulnerable state.
   - `getProvider()` now trims, so `" firebase"` from a YAML/Helm value no longer
     degrades silently to mock.
   - The dev-login affordances are gated on `import.meta.env.DEV`, so Vite strips
     the token literals from the production bundle (verified: zero `test-token-*`
     hits in `dist/assets/*.js`).
   - `/api/health` withholds `mode` in production; it previously told an
     unauthenticated scanner whether an instance was exploitable.

   Regression coverage: `src/tests/productionAuthSafety.test.ts` (13 tests). Each
   was verified to FAIL when its corresponding guard is reverted.

   Note on blast radius, for accurate incident triage: mock mode also selected
   mock **repositories**, so this was anonymous-admin plus silent total data loss
   on every restart — not a Firestore exfiltration path.

Phase 5 lifecycle items — RESOLVED:

1. RESOLVED — `src/types/api.ts` stage union now derives from `JobStage`.
2. RESOLVED — `portal/JobDetailPage.tsx` no longer hardcodes a lifecycle array.
3. RESOLVED — `AppDtos.ts` stage is `JobStage`, so drift is compile-checked.

Open items, highest value first:

4. RESOLVED — `portal/EstimateDetailPage.tsx` gated on `status === 'draft' ||
   status === 'pending'`. `'pending'` is not a domain status, so the gate was
   false for every actionable estimate. The blast radius was wider than
   previously recorded: it gated FOUR surfaces, not one — the approve/reject
   controls and the submit button never rendered, the header told the customer
   the estimate was "locked", and every line item was labelled "Approved". The
   `handleToggleItem` early-return recorded here was unreachable dead code.
   The page now consumes the server-computed `EstimateResponseDto.isActionable`,
   renders each item's real `decision`, and requires an explicit decision on
   every optional item (previously one selection enabled submit and untouched
   optional items were silently rejected, locking the estimate irreversibly).
   Backend was NOT weakened: ownership, staff-impersonation, price authority,
   immutability, idempotency and concurrency were each re-verified intact.

   Structural cause, now fixed: `EstimateResponseDto.status` was a bare `string`
   while its sibling `JobResponseDto.stage` had been narrowed to `JobStage` in
   Step 5.6. It is now `EstimateStatus`, so `=== 'pending'` is a compile error.
   Coverage: `src/tests/estimateApprovalIntegrity.test.ts` (13 tests).
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

### Discovered during the Step 5.7 audit (not fixed, deliberately out of scope)

18. **Customer estimate list is unreachable.** `portal/EstimatesPage.tsx` is a
    hardcoded stub that renders an "API GAP" banner and a permanent empty state;
    no `GET /api/v1/estimates` route exists. So even with debt #4 fixed, a
    customer can only reach the estimate page by typing a raw id into the URL.
    `IEstimateRepository.findByCustomerId` DOES exist — what is missing is a
    service method, an HTTP route, and a real page. This is feature work, not
    remediation, which is why it was not bundled into the Step 5.7 fix. It is
    the highest-value next commercial item.
19. **Mandatory-item rejection is enforced only in the UI.** The comment at
    `EstimateApplicationService.ts` claims a mandatory item cannot be rejected
    without acknowledgement, but the loop below it only checks a decision
    EXISTS. A crafted request can reject a safety-critical item and lock the
    estimate. **This needs a business decision** (hard block, or acknowledged
    override with an audit trail) before it is coded — it is policy, not a bug
    to silently patch.
20. **`ApprovalRecord.serverRecordedIp` is attacker-controlled.** `authMiddleware`
    takes raw `x-forwarded-for` and Express `trust proxy` is never configured.
    This undermines the non-repudiation value of the immutable audit record.
    The same missing config makes the rate limiter key on the proxy's IP, so
    behind a load balancer the entire internet shares one 120 req/min bucket.
21. **Estimate supersession does not exist.** `version` and `parentEstimateId`
    are dead fields nothing ever sets; every estimate is version 1. Two pending
    estimates on one job can both be approved and both invoiced. Combined with
    `locked` being terminal, there is no path to revise a mistakenly-locked
    estimate.
22. **The mock concurrency guard passes for the wrong reason.** The estimate
    concurrency invariant holds in tests because `MockEstimateRepository` returns
    the same object instance on every read, so the first writer's in-memory
    mutation trips the immutability check for everyone else. The real
    compare-and-swap lives in the Firestore transaction and has NO test coverage.
    Anyone "hardening" the mock to deep-copy on read would silently drop the
    invariant while the test keeps passing.
23. **Idempotency keys provide no mutual exclusion.** `findByKey` then `save` is
    read-then-write with no create-if-absent and no transaction, in both the mock
    and Firestore implementations.
24. **Estimate 403/404 enumeration leak.** `findById`/404 precedes the ownership
    assertion on both the GET and the decision route, so a caller can distinguish
    "exists but not yours" from "does not exist".
25. **`EstimateFirestoreMapper` casts `doc.status as EstimateStatus` unchecked**,
    exactly parallel to debt #7 for `JobStage`. The DTO narrowing in Step 5.7
    made the contract honest but added no runtime validation at the I/O boundary.
26. **`optionalAuth()` in `authMiddleware` degrades to `roles: ['anonymous']` on
    a verification error.** Currently dead code — zero routes reference it — but
    it is a fail-open shape sitting in the auth middleware.

### Discovered during Phase 6 discovery (six-agent audit, HEAD 7074803)

These were VERIFIED findings from the appointment-domain audit. Items #27-#30,
#34 and #39 were FIXED in Phase 6.1 (see "Step 6.1" in the step history). The
rest remain open.

LIVE BUGS (all RESOLVED in Phase 6.1):

27. RESOLVED — "Invalid Date" is gone. `AppointmentsPage.tsx` and
    `DashboardPage.tsx` read `apt.scheduledAt`, a field that exists nowhere in
    the backend, so `new Date(undefined)` rendered `Invalid Date` on both
    surfaces where a customer checks when their car is due. Both now render
    `preferredDate` + `preferredTimeSlot` through
    `src/lib/appointmentDisplay.ts`. Verified in a real browser.
28. RESOLVED — `apt.notes` -> `apt.customerNotes`. Notes now display.
29. RESOLVED — `AppointmentResponseDto.status` is now `AppointmentStatus`, and
    `dropoffType`/`preferredTimeSlot` are narrowed too. Crucially both pages now
    use `useApi<{ appointments: AppointmentResponseDto[] }>` instead of `any[]`;
    without that the DTO narrowing is inert (the same lesson as Step 5.6 item 4
    and debt #8). **Proven load-bearing**: re-injecting `apt.scheduledAt` and
    `apt.notes` produces TS2339 and `tsc` exits 2.

SECURITY (least-privilege, pre-existing, NOT introduced by Step 5.7):

30. RESOLVED (P0, Phase 6.1) — any authenticated staff member, `technician` and
    `mechanic` included, could cancel ANY customer's appointment, because
    `AuthorizationGuard.assertCustomerOwnsEntity` early-returns for
    `actorType === 'staff'` (`AuthorizationGuard.ts:24`) and
    `appointmentRoutes.ts` mounted only `requireAuth()`. **Reproduced before the
    fix** over the service layer: technician and mechanic both moved a stranger's
    appointment to `cancelled`.

    Fix: `cancelAppointment` now uses the pre-existing
    `AuthorizationGuard.assertCustomerOnly` (`AuthorizationGuard.ts:42`, already
    proven at `EstimateApplicationService.ts:157`), so the customer route is
    customer-only and staff are strictly forbidden on it. Staff keep a
    legitimate path via the new explicitly-guarded `/internal/appointments/:id/cancel`.
    `assertCustomerOwnsEntity` itself was deliberately NOT changed — ~14 call
    sites in unrelated features; that is debt #32.

    Re-verified after the fix: all six staff roles blocked on the customer route,
    another customer blocked, the owner still allowed.
31. **Same guard, same shape: any staff member can rewrite any customer's
    odometer.** `PATCH /api/v1/vehicles/:id/mileage` (`vehicleRoutes.ts:65`,
    `requireAuth()` only) reaches `VehicleApplicationService.ts:85`, which uses
    the same staff-early-return guard. Proven: 40000 -> 999999 with a technician
    token. Odometer readings are commercially significant in the UAE resale
    market. This is NOT appointment scope and should be triaged on its own.
32. **`assertCustomerOwnsEntity` is misnamed for what it does.** Its name and its
    comment ("may inspect") both read as a read-only ownership check, but it
    permits staff to perform destructive writes at every call site. ~14 call
    sites. Splitting it into a strict variant and a staff-readable variant would
    have made #30 and #31 visible on sight.
33. **403/404 enumeration oracle** on appointment cancel and on the other
    customer-owned reads: `findById`/404 precedes the ownership assertion.

FUNCTIONAL GAPS (genuine Phase 6 scope):

34. RESOLVED (Phase 6.1) — `staffConfirmAppointment` existed but no route reached
    it, so `requested -> confirmed` was unreachable and every appointment was
    permanently `requested` or `cancelled`. Its inline role list also omitted
    `service_advisor`, matching neither canonical guard.

    Fix: `POST /api/v1/internal/appointments/:id/confirm` and `.../cancel` are
    now mounted in `internalRoutes.ts` behind the existing `commercialStaffGuard`
    (`admin`, `workshop_manager`, `service_advisor`, `advisor`), and the service
    role list was corrected to match. Verified: `service_advisor` can now confirm;
    `technician`/`mechanic` get 403.
35. RESOLVED (Phase 6.2) — `Appointment.complete()` and `markNoShow()` had zero
    callers, leaving four of the five `AppointmentStatus` values unreachable at
    runtime. They now have service methods and routes
    (`staffCompleteAppointment`, `staffMarkNoShow`), so all five statuses are
    reachable.
36. **There is no job-creation path anywhere in the application.** No service or
    route ever calls `jobRepo.save()`; `new Job(...)` appears only in the
    Firestore mapper (rehydration) and in tests. Every Job in the system today
    must be seed data or a direct database write. `Job.appointmentId` exists and
    is persisted but is never populated and is absent from `JobResponseDto`.
    **Phase 6's largest item is therefore not scheduling — it is job creation,
    which this product has never had.**
37. **No capacity model of any kind** — no bays, technician availability,
    working hours, or service durations. No timezone handling anywhere, for a
    UAE (GST, UTC+4) business.
38. **No appointment concurrency or idempotency control.** Both repositories use
    unconditional last-write-wins `set()`. Two customers can silently book the
    same slot. The transactional lock-document pattern already proven in
    `FirestoreApprovalRepository` is not applied here.
39. RESOLVED (Phase 6.1) — `preferredTimeSlot` had three disagreeing
    vocabularies (entity comment `"09:00 - 11:00"`, UI sending
    `"Morning"/"Afternoon"/"Evening"`, dead `types/api.ts` declaring
    `'morning' | 'afternoon'`) and no validation at any layer. The canonical
    vocabulary is now `AppointmentTimeSlot = 'morning' | 'afternoon' | 'evening'`,
    validated in the entity and at the Firestore boundary. Display labels live
    once in `src/lib/appointmentDisplay.ts`. Settled before real bookings exist,
    so no migration is needed.
40. RESOLVED (Phase 6.1) — appointment coverage was a single state-machine unit
    test. `src/tests/appointmentDomainIntegrity.test.ts` now adds 14 tests
    covering validation, ownership, staff RBAC, lifecycle, terminal states and
    mapper guards. Suite went 120 -> 134. Each new guard was reverted one at a
    time to confirm its test actually fails against the pre-fix behaviour.

### Discovered during Phase 6.1 (verified, deliberately NOT fixed — out of scope)

41. **The rate limiter is mounted globally, ahead of the Vite dev middleware.**
    `src/server/app.ts:25` applies `rateLimiterMiddleware` to the whole app, and
    `server.ts` mounts `vite.middlewares` after it. In dev, Vite serves hundreds
    of individual ES modules over HTTP, so ONE page load exhausts the 120 req/min
    bucket and the SPA fails to boot at all — every module request returns 429
    and the page renders blank. Proven with Playwright: the appointments page
    produced an empty `<body>` and zero buttons until the limit was temporarily
    raised. The limiter should be scoped to `/api` (or the Vite branch mounted
    ahead of it). Related to debt #20, which is the production half of the same
    middleware being under-specified.
42. **CORRECTED — customer creation exists but the frontend never calls it.** An
    earlier revision of this entry claimed no customer-creation path existed
    anywhere. That was WRONG, and the error came from generalising a single 404.
    `POST /api/v1/auth/bootstrap` (`authRoutes.ts:39,54`) provisions a customer
    via `CustomerApplicationService.syncAuthenticatedCustomer`. What is actually
    missing is the client call: `AuthProvider` only calls `GET /auth/me`, which
    runs `getProfile` and 404s when no `Customer` row exists. So a fresh instance
    has no customer until something calls bootstrap directly.

    Still open: the login flow should bootstrap-then-fetch rather than fetch-only.
    Verify claims like this against the routing table before recording them.

### Discovered during demo preparation (2026-09-07)

43. **`VehiclesPage` rendered fields that do not exist on `VehicleResponseDto`.**
    FIXED. It read `v.emirate`, `v.plateCode`, `v.plateNumber` and
    `v.currentMileageKm` — all fields of the DEAD `src/types/api.ts` (debt #5),
    not of the real DTO, which carries `plate: { emirate, code, number,
    displayString }` and `odometerReadingKm`. Every vehicle card therefore showed
    "undefined undefined-undefined" for the plate and "0 km" for mileage. Invisible
    to `tsc` because the page used `useApi<{ vehicles: any[] }>` and
    `vehicles.map((v: any) => ...)`.

    This is the THIRD instance of the same defect class (debt #4 estimates, #27/#28
    appointments, now vehicles): a page reading invented field names behind `any`.
    Now typed `VehicleResponseDto[]` with the `: any` removed, and verified
    load-bearing — restoring the old field names produces three TS2339 errors.
    **Any remaining `useApi<{ ...: any[] }>` in the portal is a latent instance of
    this bug.**

44. **Invoice generation required an `approvalId` that was exposed nowhere.**
    FIXED. `StaffInvoiceCreatePage` asked staff to type an approval id, but no
    route served approvals (zero `approvalRepo` references across all routes), the
    id appeared only inside a domain event, and no page displayed it — so the
    protected customer -> payment chain could not be completed through the UI.
    Added `GET /internal/estimates/:id/approval` behind `commercialStaffGuard`,
    surfaced the reference plus a "Generate Invoice" action on the staff estimate
    page, and made the invoice form accept a prefilled `?approvalId=`.
    Four regression tests; the role guard is verified load-bearing.

45. **The customer estimate page recomputes VAT client-side.**
    `portal/EstimateDetailPage.tsx` derives its displayed subtotal/VAT/total from
    `unitPriceFils * quantity * 0.05` rather than using the server-computed
    `subtotalDisplay`/`vatDisplay`/`totalDisplay`. That is a second source of truth
    for money and will drift from the server's rounding (see #46). It also formats
    without thousands separators, unlike every other money surface. Not fixed —
    commercial-model change, deliberately out of scope before the client demo.

46. **Per-line vs per-total VAT rounding differs from the client's real invoice.**
    On the client's own document (AutoGuru INV260526412) VAT is computed per line
    and summed, giving AED 208.40 on a 4,168.11 subtotal. `TaxCalculationService`
    computes VAT on the subtotal, giving 208.41 — a one-fil difference, so our
    total reads 4,376.52 against their 4,376.51. Our subtotal matches exactly.
    This is a deliberate policy question for the client, not a defect to patch
    silently; changing it touches Phase 5 protected commercial code.

47. **The client's commercial model has three buckets; ours has a different three.**
    Their invoice separates Spare Parts / Labour Charges / **Sublet Services**
    (outsourced work such as AC condenser flush and laser wheel alignment).
    `EstimateItemType` is `'part' | 'labor' | 'consumable'` — no `sublet`, and they
    have no `consumable`. The demo fixture types sublet lines as `labor` and marks
    them in the description. Adding a real `sublet` type is a commercial-model
    decision for Phase 7 alongside parts/inventory.

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
- DONE — stage-type drift resolved in Step 5.6, committed as `a099b7f`
- DONE — `origin/main` aligned; Step 5.6 was pushed
- DONE — P0 authentication fail-open closed (Step 5.7, debt item 0)
- DONE — P1 customer estimate approval restored (Step 5.7, debt item 4)
- OPEN — retire the dead duplicate DTOs in `src/types/api.ts` (see debt #5)

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
