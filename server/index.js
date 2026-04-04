import cors from "cors";
import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

const stageOrder = ["josh", "joey", "steve", "hulk"];
const agentNameById = {
  josh: "Josh",
  joey: "Joey",
  steve: "Steve",
  hulk: "Hulk",
};

const state = {
  agents: [
    {
      id: "josh",
      name: "Josh",
      role: "Intake + intent parsing",
      status: "active",
      avatarColor: "bg-sky-500",
      capabilities: ["Inbox triage", "Ticket creation", "Context extraction"],
      currentTaskId: "TASK-104",
      lastActiveAt: "2026-04-04T11:20:00.000Z",
    },
    {
      id: "joey",
      name: "Joey",
      role: "Research + dependency mapping",
      status: "waiting",
      avatarColor: "bg-emerald-500",
      capabilities: ["Knowledge retrieval", "Gap analysis", "Risk tagging"],
      currentTaskId: "TASK-102",
      lastActiveAt: "2026-04-04T11:17:00.000Z",
    },
    {
      id: "steve",
      name: "Steve",
      role: "Planner + spec authoring",
      status: "idle",
      avatarColor: "bg-amber-500",
      capabilities: ["Execution planning", "Spec drafting", "Acceptance criteria"],
      lastActiveAt: "2026-04-04T11:10:00.000Z",
    },
    {
      id: "hulk",
      name: "Hulk",
      role: "Executor + verifier",
      status: "active",
      avatarColor: "bg-rose-500",
      capabilities: ["Implementation", "Testing", "Deployment checks"],
      currentTaskId: "TASK-101",
      lastActiveAt: "2026-04-04T11:22:00.000Z",
    },
  ],
  tasks: [
    {
      id: "TASK-101",
      title: "Release readiness dashboard",
      description: "Build monitoring dashboard for daily standup.",
      stage: "hulk",
      assignedAgent: "hulk",
      status: "in_progress",
      createdAt: "2026-04-04T09:00:00.000Z",
      updatedAt: "2026-04-04T11:22:00.000Z",
      handoffs: [
        { from: "josh", to: "joey", at: "2026-04-04T09:12:00.000Z", note: "Requirements normalized." },
        { from: "joey", to: "steve", at: "2026-04-04T09:48:00.000Z", note: "Dependencies documented." },
        { from: "steve", to: "hulk", at: "2026-04-04T10:20:00.000Z", note: "Implementation plan approved." },
      ],
    },
    {
      id: "TASK-102",
      title: "Email response policy update",
      description: "Apply governance updates to outbound replies.",
      stage: "joey",
      assignedAgent: "joey",
      status: "in_progress",
      createdAt: "2026-04-04T09:30:00.000Z",
      updatedAt: "2026-04-04T11:17:00.000Z",
      handoffs: [{ from: "josh", to: "joey", at: "2026-04-04T09:40:00.000Z", note: "Intent and urgency classified." }],
    },
    {
      id: "TASK-103",
      title: "Incident postmortem summary",
      description: "Summarize root causes and action items.",
      stage: "steve",
      assignedAgent: "steve",
      status: "waiting",
      createdAt: "2026-04-04T10:15:00.000Z",
      updatedAt: "2026-04-04T10:58:00.000Z",
      handoffs: [
        { from: "josh", to: "joey", at: "2026-04-04T10:20:00.000Z", note: "Collected incident threads." },
        { from: "joey", to: "steve", at: "2026-04-04T10:58:00.000Z", note: "Sources aligned and deduped." },
      ],
    },
    {
      id: "TASK-104",
      title: "Customer escalation triage",
      description: "Triage urgent escalation and assign owners.",
      stage: "josh",
      assignedAgent: "josh",
      status: "queued",
      createdAt: "2026-04-04T11:16:00.000Z",
      updatedAt: "2026-04-04T11:20:00.000Z",
      handoffs: [],
    },
  ],
  messages: [
    {
      id: "MSG-1",
      from: "josh",
      to: "joey",
      content: "Passing customer requirements pack for dependency scan.",
      taskId: "TASK-101",
      timestamp: "2026-04-04T09:12:00.000Z",
      type: "handoff",
    },
    {
      id: "MSG-2",
      from: "joey",
      to: "steve",
      content: "Found three external API dependencies and one risk.",
      taskId: "TASK-101",
      timestamp: "2026-04-04T09:48:00.000Z",
      type: "response",
    },
    {
      id: "MSG-3",
      from: "steve",
      to: "hulk",
      content: "Execution spec approved. Build dashboard with live feed first.",
      taskId: "TASK-101",
      timestamp: "2026-04-04T10:20:00.000Z",
      type: "handoff",
    },
  ],
  emails: [
    {
      id: "MAIL-1",
      subject: "Escalation: payment retries failing",
      from: "ops@northstar.io",
      readBy: "josh",
      timestamp: "2026-04-04T10:12:00.000Z",
      action: "Created TASK-104 and flagged urgent context.",
      status: "processed",
    },
    {
      id: "MAIL-2",
      subject: "Question about policy exception",
      from: "support@acme.com",
      readBy: "joey",
      timestamp: "2026-04-04T10:44:00.000Z",
      action: "Requested missing governance details from Josh.",
      status: "read",
    },
  ],
  events: [
    {
      id: "EVT-1",
      timestamp: "2026-04-04T11:22:00.000Z",
      category: "task",
      summary: "Hulk started implementation for TASK-101.",
      entities: ["hulk", "TASK-101"],
    },
    {
      id: "EVT-2",
      timestamp: "2026-04-04T11:20:00.000Z",
      category: "agent",
      summary: "Josh switched to active on TASK-104.",
      entities: ["josh", "TASK-104"],
    },
  ],
};

function buildMetrics() {
  const completed = state.tasks.filter((task) => task.completedAt);
  const durations = completed.map(
    (task) => (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60),
  );
  const avgPipeline = durations.length ? Math.round(durations.reduce((sum, m) => sum + m, 0) / durations.length) : 0;
  const activeConversations = new Set(state.messages.map((msg) => `${msg.from}-${msg.to}-${msg.taskId}`)).size;
  const processedEmails = state.emails.filter((email) => email.status === "processed").length;

  return {
    tasksCompletedToday: completed.length,
    avgPipelineTimeMinutes: avgPipeline,
    activeConversations,
    emailsProcessed: processedEmails,
  };
}

function snapshot() {
  return {
    agents: state.agents,
    tasks: state.tasks,
    messages: state.messages,
    emails: state.emails,
    events: state.events,
    metrics: buildMetrics(),
    syncedAt: new Date().toISOString(),
  };
}

function addEvent(event) {
  state.events = [event, ...state.events].slice(0, 80);
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function simulateSyncTick() {
  const now = new Date().toISOString();
  const randomAgent = stageOrder[Math.floor(Math.random() * stageOrder.length)];

  state.agents = state.agents.map((agent) => {
    if (agent.id === randomAgent) {
      return { ...agent, status: "active", lastActiveAt: now };
    }
    if (agent.status === "active") {
      return { ...agent, status: "waiting" };
    }
    return agent;
  });

  addEvent({
    id: generateId("EVT-heartbeat"),
    timestamp: now,
    category: "agent",
    summary: `${agentNameById[randomAgent]} heartbeat acknowledged.`,
    entities: [randomAgent],
  });

  const movingTask = state.tasks.find((task) => task.status === "in_progress" || task.status === "queued");
  if (!movingTask) return;

  const currentIndex = stageOrder.indexOf(movingTask.stage);
  if (currentIndex === -1) return;

  if (currentIndex === stageOrder.length - 1) {
    movingTask.status = "completed";
    movingTask.completedAt = now;
    movingTask.updatedAt = now;
    addEvent({
      id: generateId("EVT-complete"),
      timestamp: now,
      category: "task",
      summary: `${movingTask.id} completed by Hulk.`,
      entities: [movingTask.id, "hulk"],
    });
    return;
  }

  const nextStage = stageOrder[currentIndex + 1];
  movingTask.handoffs.push({
    from: movingTask.assignedAgent,
    to: nextStage,
    at: now,
    note: `Auto-handoff from ${agentNameById[movingTask.assignedAgent]} to ${agentNameById[nextStage]}.`,
  });
  movingTask.assignedAgent = nextStage;
  movingTask.stage = nextStage;
  movingTask.status = "in_progress";
  movingTask.updatedAt = now;

  state.messages = [
    {
      id: generateId("MSG"),
      from: stageOrder[currentIndex],
      to: nextStage,
      content: `${movingTask.id} synced and handed to ${agentNameById[nextStage]}.`,
      taskId: movingTask.id,
      timestamp: now,
      type: "handoff",
    },
    ...state.messages,
  ].slice(0, 120);

  addEvent({
    id: generateId("EVT-task"),
    timestamp: now,
    category: "task",
    summary: `${movingTask.id} moved ${agentNameById[stageOrder[currentIndex]]} -> ${agentNameById[nextStage]}.`,
    entities: [movingTask.id, stageOrder[currentIndex], nextStage],
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/snapshot", (_req, res) => {
  res.json(snapshot());
});

app.post("/api/sync/activity", (_req, res) => {
  simulateSyncTick();
  res.json(snapshot());
});

app.get("/api/agents", (_req, res) => {
  res.json(state.agents);
});

app.patch("/api/agents/:id", (req, res) => {
  const index = state.agents.findIndex((agent) => agent.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  state.agents[index] = {
    ...state.agents[index],
    ...req.body,
    lastActiveAt: req.body.lastActiveAt ?? new Date().toISOString(),
  };
  addEvent({
    id: generateId("EVT-agent"),
    timestamp: new Date().toISOString(),
    category: "agent",
    summary: `${state.agents[index].name} updated via API.`,
    entities: [state.agents[index].id],
  });
  res.json(state.agents[index]);
});

app.get("/api/tasks", (req, res) => {
  const { agent, status } = req.query;
  const tasks = state.tasks.filter((task) => {
    const byAgent = typeof agent === "string" ? task.assignedAgent === agent : true;
    const byStatus = typeof status === "string" ? task.status === status : true;
    return byAgent && byStatus;
  });
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const now = new Date().toISOString();
  const agent = req.body.assignedAgent || "josh";
  const task = {
    id: generateId("TASK"),
    title: req.body.title || "Untitled task",
    description: req.body.description || "",
    stage: agent,
    assignedAgent: agent,
    status: req.body.status || "queued",
    createdAt: now,
    updatedAt: now,
    handoffs: [],
  };
  state.tasks = [task, ...state.tasks];
  addEvent({
    id: generateId("EVT-task"),
    timestamp: now,
    category: "task",
    summary: `${task.id} created and assigned to ${agentNameById[agent]}.`,
    entities: [task.id, agent],
  });
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const task = state.tasks.find((entry) => entry.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const previousAgent = task.assignedAgent;
  const nextAgent = req.body.assignedAgent || previousAgent;
  if (nextAgent !== previousAgent) {
    task.handoffs.push({
      from: previousAgent,
      to: nextAgent,
      at: new Date().toISOString(),
      note: req.body.handoffNote || "Manual reassignment via API.",
    });
  }

  Object.assign(task, req.body, { updatedAt: new Date().toISOString() });
  addEvent({
    id: generateId("EVT-task"),
    timestamp: new Date().toISOString(),
    category: "task",
    summary: `${task.id} updated via API.`,
    entities: [task.id],
  });
  res.json(task);
});

app.get("/api/messages", (_req, res) => {
  res.json(state.messages);
});

app.post("/api/messages", (req, res) => {
  const message = {
    id: generateId("MSG"),
    from: req.body.from,
    to: req.body.to,
    content: req.body.content,
    taskId: req.body.taskId,
    timestamp: new Date().toISOString(),
    type: req.body.type || "query",
  };
  state.messages = [message, ...state.messages].slice(0, 120);
  addEvent({
    id: generateId("EVT-msg"),
    timestamp: message.timestamp,
    category: "message",
    summary: `${agentNameById[message.from]} messaged ${agentNameById[message.to]} on ${message.taskId}.`,
    entities: [message.id, message.taskId],
  });
  res.status(201).json(message);
});

app.get("/api/emails", (_req, res) => {
  res.json(state.emails);
});

app.get("/api/events", (_req, res) => {
  res.json(state.events);
});

app.listen(PORT, () => {
  console.log(`Agent activity API running on http://localhost:${PORT}`);
});
