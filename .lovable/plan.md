

# Agent Monitoring Dashboard

## Overview

A real-time monitoring dashboard for your multi-agent system (Josh, Joey, Steve, Hulk) that visualizes agent activity, inter-agent conversations, task pipelines, and integration activity like email reads.

## Architecture

Since no agent backend is connected yet, the dashboard will be built with a clean data layer (TypeScript types + mock data) that can be swapped for real API/WebSocket connections later.

```text
┌─────────────────────────────────────────────────┐
│                  Dashboard Layout                │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content Area                    │
│          │  ┌──────────────────────────────────┐ │
│ • Overview│  │ Agent Status Cards (4 agents)    │ │
│ • Agents │  │ [Josh] [Joey] [Steve] [Hulk]     │ │
│ • Tasks  │  ├──────────────────────────────────┤ │
│ • Comms  │  │ Live Activity Feed               │ │
│ • Emails │  │ (scrolling timeline of events)   │ │
│ • Settings│ ├──────────────────────────────────┤ │
│          │  │ Task Pipeline / Conversation View │ │
│          │  └──────────────────────────────────┘ │
└──────────┴──────────────────────────────────────┘
```

## Pages & Components

### 1. Overview Page (`/`)
- **Agent Status Cards** — each agent (Josh, Joey, Steve, Hulk) with status indicator (idle/active/waiting), current task, last active timestamp
- **Pipeline Visualization** — horizontal flow diagram: Josh → Joey → Steve → Hulk showing which stage a task is in
- **Key Metrics** — tasks completed today, avg pipeline time, active conversations, emails processed

### 2. Agents Page (`/agents`)
- Detailed view per agent: role description, capabilities, current state
- Activity history per agent
- Click into any agent for a detail panel

### 3. Tasks Page (`/tasks`)
- Table of all tasks with columns: ID, title, current stage, assigned agent, status, created, updated
- Filter by agent, status, date range
- Click a task to see its full journey through the pipeline with timestamps at each handoff

### 4. Conversations Page (`/conversations`)
- Thread view showing inter-agent messages
- Each message shows: sender agent, recipient agent, timestamp, content, context passed
- Filter by agent pair or task

### 5. Email Monitor Page (`/emails`)
- List of emails read/processed with: subject, from, read by (agent), timestamp, action taken
- Status badges: read, processed, flagged, ignored

### 6. Settings Page (`/settings`)
- Agent configuration (roles, permissions, governance rules)
- Pipeline order configuration
- Notification preferences

## Data Layer

**Types** (`src/types/agent-types.ts`):
- `Agent` — id, name, role, status, avatar color, capabilities
- `AgentTask` — id, title, description, stage, assignedAgent, status, timestamps, handoffs
- `AgentMessage` — id, from, to, content, taskId, timestamp, type (handoff/query/response)
- `EmailActivity` — id, subject, from, readBy, timestamp, action, status

**Mock data** (`src/data/mock-agents.ts`): Realistic sample data for all four agents with sample tasks flowing through the pipeline, conversations, and email activities. Includes a simulated "live" effect using intervals.

## Technical Details

- **Routing**: 6 routes added to App.tsx
- **Layout**: Sidebar using shadcn Sidebar component with NavLink for active state
- **UI components**: Cards, Tables, Badges, Tabs, Avatars (all existing shadcn)
- **Charts**: Pipeline progress bars and status indicators using Tailwind utilities
- **Animations**: Pulse indicators for active agents, smooth transitions for feed updates
- **Colors**: Each agent gets a distinct accent color for easy identification
- **Responsive**: Works on the current 1311px viewport, collapses sidebar on mobile

## Files to Create/Modify

1. `src/types/agent-types.ts` — Type definitions
2. `src/data/mock-agents.ts` — Mock data + simulated live updates
3. `src/components/layout/DashboardLayout.tsx` — Sidebar + main area layout
4. `src/components/dashboard/AgentStatusCard.tsx` — Individual agent card
5. `src/components/dashboard/PipelineView.tsx` — Josh→Joey→Steve→Hulk flow
6. `src/components/dashboard/ActivityFeed.tsx` — Scrolling event timeline
7. `src/components/dashboard/ConversationThread.tsx` — Agent-to-agent messages
8. `src/components/dashboard/TaskDetail.tsx` — Task journey view
9. `src/pages/Dashboard.tsx` — Overview page
10. `src/pages/AgentsPage.tsx` — Agent details
11. `src/pages/TasksPage.tsx` — Task table + detail
12. `src/pages/ConversationsPage.tsx` — Message threads
13. `src/pages/EmailMonitorPage.tsx` — Email tracking
14. `src/pages/SettingsPage.tsx` — Configuration
15. `src/App.tsx` — Add routes + wrap in SidebarProvider

## Future Integration Points

The mock data layer is designed so that when you're ready to connect real agent systems, you replace the mock functions with:
- WebSocket connections for real-time agent status
- API calls to your agent orchestrator for task/conversation data
- Gmail/email API integration for email monitoring

