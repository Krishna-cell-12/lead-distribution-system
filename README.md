# Prowider Mini Lead Distribution System

> **Full Stack Developer Internship Assignment**  
> A production-grade lead generation and distribution platform built with Next.js, PostgreSQL, and Prisma.

---

## Live Demo

🔗 https://lead-distribution-system-one.vercel.app/

| Page | Route |
|---|---|
| Customer Service Request Form | `/` |
| Provider Dashboard | `/dashboard?providerId=<uuid>` |
| Testing & Tools Panel | `/test-tools` |

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Database Design](#database-design)
- [Allocation Algorithm](#allocation-algorithm)
- [Concurrency Handling](#concurrency-handling)
- [Webhook Idempotency](#webhook-idempotency)
- [Setup & Local Development](#setup--local-development)
- [API Reference](#api-reference)
- [Seed Data](#seed-data)
- [Project Structure](#project-structure)

---

## Overview

This system simulates a real-world lead distribution platform similar to Prowider. When a customer submits a service enquiry:

1. The lead is **saved to the database**
2. It is **automatically assigned to exactly 3 providers** based on deterministic business rules
3. Mandatory providers for that service are **always prioritised**
4. Remaining slots are **distributed fairly** using a persistent round-robin algorithm
5. Provider dashboards **update in real time** without a page refresh

The system is designed to be correct under concurrent load, resilient to duplicate webhook calls, and free of any race conditions or quota overruns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Styling** | Tailwind CSS v4 |
| **Runtime** | Node.js (serverless-compatible) |
| **Deployment** | Vercel |

---

## Features

### Feature 1 — Customer Service Request Form (`/`)

- Fields: Customer Name, Phone Number, City, Service Type (dropdown), Description
- **Duplicate prevention** enforced at the **database level** via a `@@unique([phoneNumber, serviceId])` compound constraint — the same phone number cannot raise a second lead for the same service
- On submission, the lead is saved and provider assignment is triggered automatically within a single atomic transaction

### Feature 2 — Lead Distribution Engine (`/api/leads` POST)

- Assigns **exactly 3 providers** to every new lead
- Applies **mandatory routing rules** first (see Allocation Algorithm below)
- Fills remaining slots using **timestamp-based round-robin** — never random
- Enforces **monthly quota** (max 10 leads per provider per month)
- Uses **`SELECT ... FOR UPDATE` pessimistic locking** inside a Prisma transaction to prevent race conditions under concurrent load
- Retries up to **10 times** with exponential backoff + jitter on deadlock/conflict errors

### Feature 3 — Provider Dashboard (`/dashboard`)

- Accepts `?providerId=<uuid>` query parameter
- Displays: remaining quota, total leads received, full list of assigned leads with timestamps
- Falls back to the first seeded provider when no ID is specified

### Feature 4 — Real-Time Dashboard Updates

- Implemented via **polling every 3 seconds** — zero dependency on WebSockets or SSE infrastructure
- The animated live-indicator badge confirms the auto-refresh is active
- Dashboard reflects new leads within ≤ 3 seconds of assignment

### Feature 5 — Webhook & Testing Panel (`/test-tools`)

Two independent testing tools on one page:

**Idempotent Quota Reset Webhook**
- Select a provider, supply or generate a UUID idempotency key
- Click *Submit Webhook* once → quota resets, `ProcessedWebhook` record created
- Click again with the **same key** → returns `200 OK` with `"duplicated": true` — **database is not touched**
- Backed by `/api/webhooks/reset-quota`

**Concurrency Lead Distributor Tester**
- Select a service, click *Fire 10 Concurrent Requests*
- Fires 10 simultaneous `POST /api/leads` calls via `Promise.all()`
- Results table shows which succeeded (201), which failed due to quota exhaustion, and which providers were assigned
- Validates that no quota is overrun and distribution is deterministic

---

## Database Design

```prisma
model Service {
  id    String @id @default(uuid())
  name  String
  leads Lead[]
}

model Provider {
  id                String           @id @default(uuid())
  name              String
  quota             Int              @default(10)
  currentMonthLeads Int              @default(0)
  assignments       LeadAssignment[]
}

model Lead {
  id           String           @id @default(uuid())
  customerName String
  phoneNumber  String
  serviceId    String
  service      Service          @relation(...)
  createdAt    DateTime         @default(now())
  assignments  LeadAssignment[]

  @@unique([phoneNumber, serviceId])   // ← duplicate prevention at DB level
}

model LeadAssignment {
  leadId     String
  providerId String
  assignedAt DateTime @default(now())
  lead       Lead     @relation(...)
  provider   Provider @relation(...)

  @@id([leadId, providerId])           // ← prevents same provider getting same lead twice
}

model ProcessedWebhook {
  idempotencyKey String   @id        // ← natural unique key for idempotency
  processedAt    DateTime @default(now())
}
```

**Key design decisions:**

- `@@unique([phoneNumber, serviceId])` on `Lead` — the duplicate-phone rule is enforced by the database, not just application code. Even if two concurrent requests arrive for the same phone+service, only one row will be inserted; the second gets a `P2002` unique constraint violation.
- `@@id([leadId, providerId])` on `LeadAssignment` — a composite primary key prevents the same provider from being assigned the same lead twice, even under concurrency.
- `ProcessedWebhook` uses `idempotencyKey String @id` — inserting a duplicate key fails atomically, guaranteeing exactly-once webhook processing.
- `currentMonthLeads` is incremented inside the same transaction as the `LeadAssignment` insert, so the quota counter is always consistent with actual assignments.

---

## Allocation Algorithm

Every new lead must be assigned to **exactly 3 providers**. The algorithm runs inside a single serialisable transaction:

### Step 1 — Mandatory Routing

Before any fair distribution, mandatory providers are pinned based on the requested service:

| Service | Mandatory Providers |
|---|---|
| Web Development (Service 1) | Provider 1 |
| Mobile App Development (Service 2) | Provider 5 |
| SEO Optimization (Service 3) | Provider 1 **and** Provider 4 |

A mandatory provider is only included if they still have remaining quota (`currentMonthLeads < quota`).

### Step 2 — Fair Pool Selection

Each service has a defined **fair pool** for the remaining slot(s):

| Service | Fair Pool |
|---|---|
| Web Development | Providers 2, 3, 4 |
| Mobile App Development | Providers 6, 7, 8 |
| SEO Optimization | Providers 2, 3, 5, 6, 7, 8 |

Providers are **sorted ascending by their latest `LeadAssignment.assignedAt` timestamp** (providers who were assigned longest ago, or never, come first). The top N providers from this sorted list are selected to fill remaining slots.

This is a **persistent round-robin** — the ordering is derived entirely from data already in the database, so it survives server restarts, cold starts, and deploys.

**Random selection is never used.**

### Step 3 — Quota Check

Providers with `currentMonthLeads >= quota` are excluded from both the mandatory check and the fair pool before sorting begins. If fewer than 3 eligible providers remain, the API returns a `400 INSUFFICIENT_QUOTA` error.

---

## Concurrency Handling

The lead submission endpoint must be correct when multiple requests arrive simultaneously. The strategy is:

### 1. Pessimistic Row-Level Locking

```sql
SELECT id FROM "Provider" FOR UPDATE
```

This Postgres advisory lock is acquired at the start of every transaction. Any concurrent transaction that reaches this line blocks until the first transaction commits or rolls back. This ensures that quota reads and updates are always serialised — no two transactions can both read `currentMonthLeads = 9`, both decide to assign, and both increment to 10 (a classic TOCTOU race).

### 2. Automatic Retry with Exponential Backoff

If Prisma returns a deadlock or serialisation failure (`P2034`), the request retries automatically:

```
delay = (2^attempt × 100ms) + random_jitter(0–500ms)
```

Up to **10 retries** per request. This handles transient conflicts without surfacing errors to the customer.

### 3. Database-Level Unique Constraints

Even if two concurrent requests for the same phone+service both pass the application-level duplicate check simultaneously, only one `INSERT INTO Lead` will succeed. The other receives a `P2002` unique constraint violation, which is caught and returned as a `400 DUPLICATE_LEAD` error.

**Result:** Under a 10-concurrent-request burst (testable from `/test-tools`), no provider ever exceeds their quota, no duplicate assignments occur, and the quota counter stays perfectly consistent.

---

## Webhook Idempotency

Quota reset is delivered via a simulated payment webhook at `POST /api/webhooks/reset-quota`. Payment systems commonly deliver webhooks more than once. The implementation guarantees **exactly-once execution**:

### How It Works

1. The caller sends `{ providerId, idempotencyKey }` where `idempotencyKey` is a UUID generated by the client
2. The server looks up `ProcessedWebhook` for that key **before** opening any transaction
3. **If found** → returns `200 OK` with `"duplicated": true` immediately. The database is not touched.
4. **If not found** → opens a `prisma.$transaction` that:
   - Inserts a row into `ProcessedWebhook` (will fail with a unique violation if another concurrent call slips through)
   - Updates `Provider.currentMonthLeads = 0`
5. Any error is caught, logged with `console.log(error.message)`, and returned as `500`

### Why This Is Safe

- The `idempotencyKey String @id` constraint means concurrent calls with the same key cannot both insert — only one wins, the other fails and the outer `try/catch` returns `500` (which the caller would retry with the same key, hitting the idempotency check next time)
- Quota reset **cannot be triggered from the customer form** — it requires an explicit `POST` to `/api/webhooks/reset-quota` with a valid provider UUID and idempotency key

---

## Setup & Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or remote)
- A `.env` file with `DATABASE_URL`

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd task
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

> If using **Prisma Postgres** (Accelerate), the `prisma+postgres://` URL format is supported — the `src/lib/prisma.ts` client decodes the embedded `api_key` automatically.

### 3. Migrate Database

```bash
npx prisma migrate dev --name init
```

### 4. Seed Data

```bash
npx prisma db seed
```

This inserts:
- 3 Services: *Web Development*, *Mobile App Development*, *SEO Optimization*
- 8 Providers: *Provider 1* through *Provider 8*, each with `quota: 10`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. (Optional) Prisma Studio

```bash
npx prisma studio
```

---

## API Reference

### `POST /api/leads`

Submit a new lead and trigger provider assignment.

**Request body:**
```json
{
  "customerName": "Jane Smith",
  "phoneNumber": "9999999999",
  "serviceId": "<uuid>"
}
```

**Success `201`:**
```json
{
  "success": true,
  "lead": { "id": "...", "customerName": "...", ... },
  "assignedProviders": [
    { "id": "...", "name": "Provider 1", "currentMonthLeads": 3, "quota": 10 }
  ],
  "assignments": [...]
}
```

**Error responses:**

| Status | Code | Meaning |
|---|---|---|
| `400` | `DUPLICATE_LEAD` | Same phone + service already exists |
| `400` | `INSUFFICIENT_QUOTA` | Fewer than 3 providers have quota |
| `404` | `SERVICE_NOT_FOUND` | serviceId does not exist |
| `500` | — | Unexpected server error |

---

### `GET /api/providers?providerId=<uuid>`

Fetch provider details and lead history.

**Success `200`:**
```json
{
  "id": "...",
  "name": "Provider 1",
  "quota": 10,
  "currentMonthLeads": 4,
  "leads": [
    { "customerName": "Jane", "phoneNumber": "999...", "assignedAt": "2026-05-20T..." }
  ]
}
```

---

### `GET /api/providers/:id`

Fetch provider with full lead assignment objects (used by the dashboard for real-time updates).

---

### `POST /api/webhooks/reset-quota`

Reset a provider's monthly quota to 0. Idempotent.

**Request body:**
```json
{
  "providerId": "<uuid>",
  "idempotencyKey": "<uuid>"
}
```

**Success `200` (first call):**
```json
{
  "success": true,
  "duplicated": false,
  "message": "Provider currentMonthLeads reset successfully."
}
```

**Success `200` (duplicate call):**
```json
{
  "success": true,
  "duplicated": true,
  "message": "Webhook idempotency key already processed. Database state remained unchanged."
}
```

---

## Seed Data

| Entity | Count | Details |
|---|---|---|
| Services | 3 | Web Development, Mobile App Development, SEO Optimization |
| Providers | 8 | Provider 1–8, quota = 10, currentMonthLeads = 0 |

**Mandatory routing:**

| Service | Always gets |
|---|---|
| Web Development | Provider 1 |
| Mobile App Development | Provider 5 |
| SEO Optimization | Provider 1 + Provider 4 |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Customer service request form (/)
│   ├── layout.tsx
│   ├── globals.css
│   ├── dashboard/
│   │   └── page.tsx                      # Provider dashboard (/dashboard)
│   ├── test-tools/
│   │   ├── page.tsx                      # Test panel server component
│   │   └── ClientTester.tsx              # Interactive webhook & concurrency tester
│   └── api/
│       ├── leads/
│       │   └── route.ts                  # POST — lead submission + assignment engine
│       ├── providers/
│       │   ├── route.ts                  # GET — provider details (query param)
│       │   └── [id]/route.ts             # GET — provider by UUID (dashboard)
│       └── webhooks/
│           └── reset-quota/
│               └── route.ts              # POST — idempotent quota reset webhook
├── lib/
│   └── prisma.ts                         # Singleton Prisma + pg pool client
prisma/
├── schema.prisma                         # Database schema
└── seed.ts                               # Seed script (services + providers)
```

---

## Evaluation Criteria (Self-Assessment)

| Criterion | Implementation |
|---|---|
| ✅ Correct provider allocation | Mandatory routing + timestamp round-robin, exactly 3 per lead |
| ✅ Data consistency under concurrency | `SELECT FOR UPDATE` + 10-retry exponential backoff |
| ✅ Webhook safety & idempotency | `ProcessedWebhook` table with UUID PK, pre-transaction check |
| ✅ Real-time dashboard | 3-second polling with animated live indicator |
| ✅ Database design quality | Composite PKs, unique constraints, no in-memory state |
| ✅ Code clarity | TypeScript throughout, single-responsibility routes, inline comments |

---

## Author

**Krishna** — Full Stack Developer Internship Candidate  
Built for the **Prowider Mini Lead Distribution System** assignment.
