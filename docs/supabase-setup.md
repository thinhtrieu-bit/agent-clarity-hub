# Supabase Setup (OpenClaw + Dashboard)

## Data Flow

1. OpenClaw sends updates to REST API (`/api/tasks`, `/api/messages`, `/api/agents/:id`, `/api/sync/activity`).
2. API persists to Supabase Postgres tables.
3. Dashboard reads rows directly from Supabase (`agents`, `tasks`, `messages`, `emails`, `events`).
4. Dashboard subscribes to Supabase Realtime channels and refreshes instantly on changes.

## Required Environment Variables

Backend:

```bash
OPENCLAW_API_KEY=[GENERATE-A-LONG-RANDOM-SECRET]
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.zvcyolyidfbskawtrkcm.supabase.co:5432/postgres
```

Frontend:

```bash
VITE_SUPABASE_URL=https://zvcyolyidfbskawtrkcm.supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

## Tables Used

- `agents`
- `tasks`
- `messages`
- `emails`
- `events`
- `change_log`

Each main table stores current entity state in `payload_json` and keeps `created_at` / `updated_at`.

The API bootstraps these tables on first connection. You do not need to create them manually unless you want to pre-provision the schema ahead of deployment.

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

## Realtime Setup

Dashboard live refresh depends on Supabase Realtime being enabled for the five activity tables:

```sql
alter publication supabase_realtime add table agents;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table emails;
alter publication supabase_realtime add table events;
```

If a table is already in the publication, Supabase will return an error for that individual statement. That is safe to ignore.

## OpenClaw Write Endpoints

OpenClaw should write through the Express API, not directly to Supabase:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/messages`
- `PATCH /api/agents/:id`
- `POST /api/sync/activity`

Compatibility/read endpoints:

- `GET /api/openclaw/snapshot`
- `GET /api/openclaw/changes?cursor=<cursor>&limit=<n>`

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
- Dashboard reads should use anon key + signed-in session (authenticated role).
- If you need dashboard writes later, add explicit `insert/update` policies per table.
