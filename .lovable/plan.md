

# Migrate to Supabase Backend

## Overview

Replace the local Express server (`server/index.js`) and mock data layer (`src/data/mock-agents.ts`) with Supabase tables and real-time subscriptions. OpenClaw will call Supabase directly via REST, and the dashboard will reflect changes instantly using Supabase Realtime.

```text
OpenClaw agents ──POST/PATCH──► Supabase REST API
                                    │
                                    ▼
                              Supabase Tables
                              (agents, tasks, messages, emails, events)
                                    │
                              Realtime subscriptions
                                    │
                                    ▼
                              Dashboard (React)
```

## Step 1: Enable Lovable Cloud + Create Tables

Set up Lovable Cloud (Supabase integration) and create 5 tables via migration:

- **agents** — id (text PK), name, role, status, avatar_color, capabilities (jsonb), current_task_id, last_active_at
- **tasks** — id (text PK), title, description, stage, assigned_agent, status, created_at, updated_at, completed_at, handoffs (jsonb)
- **messages** — id (text PK), from_agent, to_agent, content, task_id, timestamp, type
- **emails** — id (text PK), subject, sender, read_by, timestamp, action, status
- **events** — id (text PK), timestamp, category, summary, entities (jsonb)

All tables get RLS disabled initially (or open read/write policies) so OpenClaw can write via the anon/service key and the dashboard can read freely.

## Step 2: Seed Initial Data

Insert the same seed data currently in `server/index.js` (4 agents, 4 tasks, 5 messages, 4 emails, 4 events) into the new tables.

## Step 3: Replace API Client with Supabase Client

Rewrite `src/api/agent-activity-api.ts` to use the Supabase JS client instead of `fetch()` calls to localhost:8787:

- `getSnapshot()` → parallel queries to all 5 tables + compute metrics client-side
- `createTask()` → `supabase.from('tasks').insert()`
- `updateTask()` → `supabase.from('tasks').update()`
- `updateAgent()` → `supabase.from('agents').update()`
- Remove `syncActivity()` (no longer needed; real data comes from OpenClaw writes)

## Step 4: Add Realtime Subscriptions

Update `AgentActivityProvider` to subscribe to Supabase Realtime on all 5 tables. When a row changes (INSERT/UPDATE/DELETE), refresh the snapshot automatically. This replaces the 6-second polling interval.

## Step 5: Fix Build Errors + Clean Up

- Fix the TypeScript errors in `mock-agents.ts` by adding `as const` assertions for `category`, `type`, and `status` literals (needed even if mock data becomes secondary)
- Keep `mock-agents.ts` as a fallback/demo mode but make Supabase the default
- Remove or archive `server/index.js` (no longer needed)

## Step 6: Expose Supabase REST Endpoints for OpenClaw

Document the Supabase REST API endpoints that OpenClaw should call:

```text
POST   /rest/v1/tasks      — create task
PATCH  /rest/v1/tasks?id=eq.TASK-101  — update task
POST   /rest/v1/messages   — log agent message
POST   /rest/v1/events     — log activity event
PATCH  /rest/v1/agents?id=eq.josh     — update agent status
```

OpenClaw uses the Supabase URL + anon key (or service role key) with standard PostgREST headers.

## Files Modified/Created

1. **Migration** — `supabase/migrations/create_agent_tables.sql` (5 tables + seed data)
2. **`src/integrations/supabase/`** — auto-generated client (Lovable Cloud handles this)
3. **`src/api/agent-activity-api.ts`** — rewrite to use Supabase client
4. **`src/context/AgentActivityProvider.tsx`** — add Realtime subscriptions, remove polling
5. **`src/data/mock-agents.ts`** — fix TS errors with `as const` assertions
6. **`server/index.js`** — archived/removed

## Technical Notes

- Metrics (tasks completed, avg pipeline time, etc.) computed client-side from query results — same logic as current `buildMetrics()`
- `handoffs` stored as JSONB array on the tasks table — no separate join table needed
- Realtime channel subscribes to `postgres_changes` on all 5 tables with `event: '*'`

