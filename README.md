# Job Queue Dashboard

A full-stack mini job queue management system built with **React + NestJS + PostgreSQL**.

## Live URLs

- **Frontend:** <!-- Add Vercel URL after deployment -->
- **Backend API:** <!-- Add Render URL after deployment -->

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, TanStack Query, Tailwind CSS |
| Backend | NestJS 10, TypeORM, PostgreSQL |
| Database | PostgreSQL (Neon for cloud, local Postgres for dev) |

---

## Setup Instructions

### Prerequisites

- Node.js >= 18
- PostgreSQL (local) or a [Neon](https://neon.tech) free-tier database URL

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd quick-faraday
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run start:dev
```

The API will be available at `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit VITE_API_URL if your backend is not on port 3001
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/jobs` | Create a new job |
| `GET` | `/jobs` | List all jobs (optional `?status=` filter) |
| `GET` | `/jobs/counts` | Get job counts per status |
| `PATCH` | `/jobs/:id/status` | Update job status |
| `DELETE` | `/jobs/:id` | Delete a job |

### Create Job

```http
POST /jobs
Content-Type: application/json
Idempotency-Key: <optional-uuid>

{
  "title": "Send welcome email",
  "type": "email"
}
```

Valid `type` values: `email`, `report`, `export`, `import`, `notification`

### Update Status

```http
PATCH /jobs/:id/status
Content-Type: application/json

{ "status": "running" }
```

---

## State Machine

```
pending → running → completed
                  ↘ failed
```

`completed` and `failed` are **terminal states** — no further transitions are allowed.

Invalid transitions return `HTTP 422 Unprocessable Entity` with a descriptive error message.

---

## Design Decisions

### Concurrency: Pessimistic Write Locking

The core challenge: two browser tabs both viewing a `pending` job and clicking "Start" simultaneously.

**Solution:** The `PATCH /jobs/:id/status` endpoint wraps the read-modify-write in a **PostgreSQL transaction with a pessimistic write lock** (`SELECT ... FOR UPDATE`):

```ts
await dataSource.transaction(async (manager) => {
  const job = await manager.findOne(Job, {
    where: { id },
    lock: { mode: 'pessimistic_write' },  // blocks concurrent readers
  });
  // validate transition, save
});
```

This guarantees that if two requests race:
1. The first acquires the lock and transitions `pending → running`.
2. The second waits, then reads the now-`running` state and correctly gets a `422` (can't go `running → running`).

The rule is **enforced in the service layer** (not just the frontend), so API bypasses via curl or Postman are also protected.

### Database: PostgreSQL

Chosen over SQLite because:
- Native support for `SELECT FOR UPDATE` pessimistic locking
- Better concurrency handling for multiple simultaneous connections
- Free cloud hosting on Neon/Render

### Frontend: TanStack Query

Used for all server state management. Benefits:
- Automatic loading and error states
- Background refetching (10s interval) for live updates
- Simple cache invalidation on mutations

---

## Bonus: Idempotency Keys on `POST /jobs`

**The problem:** If a network glitch causes the client to retry a `POST /jobs` request, it could create duplicate jobs.

**The solution:** The client generates a UUID (`Idempotency-Key` header) before each submission. The server uses this as the job's primary key. If a request with the same key is received again (retry), it returns the already-created job instead of creating a duplicate.

```http
POST /jobs
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

This is a common pattern in production payment and job APIs (Stripe, Temporal, etc.).

---

## Assumptions & Trade-offs

- **`synchronize: true` in dev:** TypeORM auto-creates/updates the schema. In production, this is disabled and migrations should be used.
- **Enum job types:** Constrained to 5 types (`email`, `report`, `export`, `import`, `notification`) for better validation and UI. Could be free-text in a real system.
- **No auth:** Out of scope for this assignment. A real system would add JWT/session-based auth.
- **No job runner:** Jobs don't actually "run" anything — this is purely a status-tracking dashboard. A real system might use Bull or BullMQ for actual job execution.

---

## Potential Improvements

- **Pagination** on `GET /jobs` for large datasets
- **WebSockets / SSE** for real-time updates instead of polling
- **Database migrations** with TypeORM migration runner
- **Rate limiting** on the API endpoints
- **Audit log** — track who changed what and when
- **Bull/BullMQ integration** for actual background job processing
