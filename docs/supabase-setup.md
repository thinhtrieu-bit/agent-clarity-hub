# Supabase Setup (OpenClaw + Dashboard)

## Data Flow

1. OpenClaw sends updates to REST API (`/api/tasks`, `/api/messages`, `/api/agents/:id`).
2. API persists to Supabase Postgres tables.
3. Dashboard reads snapshot data from REST API (`/api/snapshot`).
4. API returns data sourced from Supabase-backed storage.

## Required Environment Variables

Backend:

```bash
OPENCLAW_API_KEY=[GENERATE-A-LONG-RANDOM-SECRET]
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.zvcyolyidfbskawtrkcm.supabase.co:5432/postgres
```

Frontend:

```bash
VITE_API_BASE_URL=http://localhost:8787/api
VITE_OPENCLAW_API_KEY=[OPTIONAL-FOR-UI-WRITES]
```

## Tables Used

- `agents`
- `tasks`
- `messages`
- `emails`
- `events`
- `change_log`

Main activity tables use normalized columns (e.g. `title`, `status`, `assigned_agent`, `timestamp`).  
`change_log` stores serialized payloads for incremental `/api/openclaw/changes`.

The API bootstraps these tables on first connection but does not seed mock data.

## Remove Existing Mock Rows (One-Time Cleanup)

If your project already contains previously seeded mock rows, run this once in Supabase SQL editor:

```sql
delete from tasks where id in ('TASK-101', 'TASK-102', 'TASK-103', 'TASK-104');
delete from messages where id in ('MSG-1', 'MSG-2', 'MSG-3');
delete from emails where id in ('MAIL-1', 'MAIL-2');
delete from events where id in ('EVT-1', 'EVT-2');
delete from agents where id in ('josh', 'joey', 'steve', 'hulk');
```

If this project is test-only and you want a fully clean state:

```sql
truncate table events, emails, messages, tasks, agents, change_log;
```

## RLS Policy Baseline (Signed-in Read)

Use authenticated users for dashboard reads.

```sql
alter table agents enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;
alter table emails enable row level security;
alter table events enable row level security;

create policy "authenticated read agents" on agents for select to authenticated using (true);
create policy "authenticated read tasks" on tasks for select to authenticated using (true);
create policy "authenticated read messages" on messages for select to authenticated using (true);
create policy "authenticated read emails" on emails for select to authenticated using (true);
create policy "authenticated read events" on events for select to authenticated using (true);
```

## OpenClaw Write Endpoints

OpenClaw should write through the Express API, not directly to Supabase:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/messages`
- `PATCH /api/agents/:id`

Compatibility/read endpoints:

- `GET /api/openclaw/snapshot`
- `GET /api/openclaw/changes?cursor=<cursor>&limit=<n>`
- `POST /api/sync/activity` is synthetic test-only and requires `ALLOW_SYNTHETIC_SYNC=true`

Authentication:

- Every write request must include `Authorization: Bearer <OPENCLAW_API_KEY>`
- If OpenClaw cannot send bearer auth, you can use `x-openclaw-key: <OPENCLAW_API_KEY>` instead
- Read endpoints stay public unless you add separate gateway auth in front of the service

Payload validation rules:

- `POST /api/tasks`: `title` required; `assignedAgent` must be one of `josh`, `joey`, `steve`, `hulk`; `status` must be a valid task status
- `PATCH /api/tasks/:id`: validates agent reassignment, task status, timestamps, and optional handoff data
- `POST /api/messages`: `from`, `to`, `content`, and `taskId` required
- `PATCH /api/agents/:id`: validates agent status, task binding, timestamps, and capabilities array

Successful writes update the durable entity row and append a `change_log` entry so OpenClaw can resume incremental reads from `/api/openclaw/changes`.

Notes:

- API writes use the Postgres connection string and are server-side.
- Dashboard reads are through API; frontend does not query Supabase directly.
- UI write actions (if enabled) must send `VITE_OPENCLAW_API_KEY` and go through API auth.
