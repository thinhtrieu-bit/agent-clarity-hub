# Agent Clarity Hub

Real-time monitoring dashboard for a multi-agent system (Josh, Joey, Steve, Hulk).

Architecture flow:

`OpenClaw updates -> REST API writes -> Supabase tables update -> Dashboard reads from Supabase + Realtime`

## Run

```bash
npm install
npm run dev:full
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787/api`
- SQLite: `server/agent-activity.sqlite` (override with `AGENT_DB_PATH`)
- OpenAPI docs: `docs/api/openapi.yaml`
- Supabase setup docs: `docs/supabase-setup.md`

## Supabase Backend Setup

1. Copy env template:
```bash
cp .env.example .env
```

2. Set your Supabase Postgres URL in `.env`:
```bash
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.zvcyolyidfbskawtrkcm.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://zvcyolyidfbskawtrkcm.supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

3. Start API:
```bash
npm run api
```

When `SUPABASE_DB_URL` is set, backend storage uses Supabase Postgres.
When it is not set, backend falls back to local SQLite.

Dashboard behavior:

- Reads all activity tables directly from Supabase.
- Subscribes to Supabase Realtime channels for instant updates.
- OpenClaw and manual actions should write through REST API endpoints.
- The API bootstraps the core tables automatically on first connection to Supabase.

4. In Supabase SQL Editor, run the RLS + Realtime setup from `docs/supabase-setup.md`.

### Optional: Install Supabase Agent Skills

```bash
npx skills add supabase/agent-skills
```

If you only want one service:

```bash
npm run dev      # frontend only
npm run api      # API only
```

## REST API

### Snapshot + Sync

- `GET /api/snapshot`
- `POST /api/sync/activity`
- `GET /api/openclaw/snapshot`
- `GET /api/openclaw/changes?cursor=<cursor>&limit=<n>`

### Agents

- `GET /api/agents`
- `PATCH /api/agents/:id`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### Conversations

- `GET /api/messages`
- `POST /api/messages`

### Integrations

- `GET /api/emails`
- `GET /api/events`

### OpenClaw write examples

Create a task:

```bash
curl -X POST http://localhost:8787/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Investigate billing drift",
    "description": "Triggered from OpenClaw webhook",
    "assignedAgent": "joey",
    "status": "queued"
  }'
```

Append a handoff message:

```bash
curl -X POST http://localhost:8787/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "from": "joey",
    "to": "steve",
    "content": "Passing the task to Steve for deeper analysis.",
    "taskId": "TASK-123",
    "type": "handoff"
  }'
```

Reassign a task:

```bash
curl -X PATCH http://localhost:8787/api/tasks/TASK-123 \
  -H "Content-Type: application/json" \
  -d '{
    "assignedAgent": "steve",
    "status": "in_progress",
    "handoffNote": "Escalated by OpenClaw."
  }'
```

For full request/response schema, use `docs/api/openapi.yaml`.
