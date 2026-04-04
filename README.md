# Agent Clarity Hub

Real-time monitoring dashboard for a multi-agent system (Josh, Joey, Steve, Hulk) with a local REST API backend.

## Run

```bash
npm install
npm run dev:full
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787/api`

If you only want one service:

```bash
npm run dev      # frontend only
npm run api      # API only
```

## REST API

### Snapshot + Sync

- `GET /api/snapshot`
- `POST /api/sync/activity`

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
