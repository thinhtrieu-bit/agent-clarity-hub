import cors from "cors";
import express from "express";
import { pathToFileURL } from "node:url";
import { createStore } from "./db.js";
import { AGENT_NAME_BY_ID, STAGE_ORDER } from "./seed-data.js";

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function buildMetrics(tasks, messages, emails) {
  const completed = tasks.filter((task) => task.completedAt);
  const durations = completed.map(
    (task) => (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60),
  );
  const avgPipeline = durations.length ? Math.round(durations.reduce((sum, m) => sum + m, 0) / durations.length) : 0;
  const activeConversations = new Set(messages.map((msg) => `${msg.from}-${msg.to}-${msg.taskId}`)).size;
  const processedEmails = emails.filter((email) => email.status === "processed").length;

  return {
    tasksCompletedToday: completed.length,
    avgPipelineTimeMinutes: avgPipeline,
    activeConversations,
    emailsProcessed: processedEmails,
  };
}

export function buildSnapshot(store) {
  const agents = store.listAgents();
  const tasks = store.listTasks();
  const messages = store.listMessages();
  const emails = store.listEmails();
  const events = store.listEvents();

  return {
    agents,
    tasks,
    messages,
    emails,
    events,
    metrics: buildMetrics(tasks, messages, emails),
    syncedAt: nowIso(),
  };
}

function addEvent(store, event) {
  store.upsertEvent(event);
  store.appendChange("event", event.id, "sync", event, event.timestamp || nowIso());
}

function createTaskFilter(query) {
  return (task) => {
    const byAgent = typeof query.agent === "string" ? task.assignedAgent === query.agent : true;
    const byStatus = typeof query.status === "string" ? task.status === query.status : true;
    return byAgent && byStatus;
  };
}

export function simulateSyncTick(store) {
  const now = nowIso();
  const randomAgent = STAGE_ORDER[Math.floor(Math.random() * STAGE_ORDER.length)];
  const agents = store.listAgents();
  const tasks = store.listTasks();

  agents.forEach((agent) => {
    const nextAgent =
      agent.id === randomAgent
        ? { ...agent, status: "active", lastActiveAt: now }
        : agent.status === "active"
          ? { ...agent, status: "waiting" }
          : agent;
    store.upsertAgent(nextAgent);
    store.appendChange("agent", nextAgent.id, "sync", nextAgent, now);
  });

  addEvent(store, {
    id: generateId("EVT-heartbeat"),
    timestamp: now,
    category: "agent",
    summary: `${AGENT_NAME_BY_ID[randomAgent]} heartbeat acknowledged.`,
    entities: [randomAgent],
  });

  const movingTask = tasks.find((task) => task.status === "in_progress" || task.status === "queued");
  if (!movingTask) return;

  const currentIndex = STAGE_ORDER.indexOf(movingTask.stage);
  if (currentIndex < 0) return;

  if (currentIndex === STAGE_ORDER.length - 1) {
    const completedTask = { ...movingTask, status: "completed", completedAt: now, updatedAt: now };
    store.upsertTask(completedTask);
    store.appendChange("task", completedTask.id, "sync", completedTask, now);
    addEvent(store, {
      id: generateId("EVT-complete"),
      timestamp: now,
      category: "task",
      summary: `${completedTask.id} completed by Hulk.`,
      entities: [completedTask.id, "hulk"],
    });
    return;
  }

  const nextStage = STAGE_ORDER[currentIndex + 1];
  const updatedTask = {
    ...movingTask,
    handoffs: [
      ...(movingTask.handoffs || []),
      {
        from: movingTask.assignedAgent,
        to: nextStage,
        at: now,
        note: `Auto-handoff from ${AGENT_NAME_BY_ID[movingTask.assignedAgent]} to ${AGENT_NAME_BY_ID[nextStage]}.`,
      },
    ],
    assignedAgent: nextStage,
    stage: nextStage,
    status: "in_progress",
    updatedAt: now,
  };
  store.upsertTask(updatedTask);
  store.appendChange("task", updatedTask.id, "sync", updatedTask, now);

  const message = {
    id: generateId("MSG"),
    from: STAGE_ORDER[currentIndex],
    to: nextStage,
    content: `${movingTask.id} synced and handed to ${AGENT_NAME_BY_ID[nextStage]}.`,
    taskId: movingTask.id,
    timestamp: now,
    type: "handoff",
  };
  store.upsertMessage(message);
  store.appendChange("message", message.id, "sync", message, now);

  addEvent(store, {
    id: generateId("EVT-task"),
    timestamp: now,
    category: "task",
    summary: `${movingTask.id} moved ${AGENT_NAME_BY_ID[STAGE_ORDER[currentIndex]]} -> ${AGENT_NAME_BY_ID[nextStage]}.`,
    entities: [movingTask.id, STAGE_ORDER[currentIndex], nextStage],
  });
}

export function createApp({ dbPath } = {}) {
  const app = express();
  const store = createStore({ dbPath });
  app.locals.store = store;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/snapshot", (_req, res) => {
    res.json(buildSnapshot(store));
  });

  app.get("/api/openclaw/snapshot", (_req, res) => {
    res.json(buildSnapshot(store));
  });

  app.get("/api/openclaw/changes", (req, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "0";
    const limit = typeof req.query.limit === "string" ? req.query.limit : "100";
    const changes = store.listChanges({ cursor, limit });
    res.json({
      items: changes.items,
      nextCursor: changes.nextCursor,
      hasMore: changes.hasMore,
      serverTime: nowIso(),
    });
  });

  app.post("/api/sync/activity", (_req, res) => {
    simulateSyncTick(store);
    res.json(buildSnapshot(store));
  });

  app.get("/api/agents", (_req, res) => {
    res.json(store.listAgents());
  });

  app.patch("/api/agents/:id", (req, res) => {
    const agent = store.getAgentById(req.params.id);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    const updated = {
      ...agent,
      ...req.body,
      lastActiveAt: req.body.lastActiveAt ?? nowIso(),
    };
    store.upsertAgent(updated);
    store.appendChange("agent", updated.id, "update", updated, updated.lastActiveAt);

    addEvent(store, {
      id: generateId("EVT-agent"),
      timestamp: nowIso(),
      category: "agent",
      summary: `${updated.name} updated via API.`,
      entities: [updated.id],
    });
    res.json(updated);
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = store.listTasks().filter(createTaskFilter(req.query));
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const now = nowIso();
    const assignedAgent = req.body.assignedAgent || "josh";
    const task = {
      id: generateId("TASK"),
      title: req.body.title || "Untitled task",
      description: req.body.description || "",
      stage: assignedAgent,
      assignedAgent,
      status: req.body.status || "queued",
      createdAt: now,
      updatedAt: now,
      handoffs: [],
    };
    store.upsertTask(task);
    store.appendChange("task", task.id, "create", task, now);

    addEvent(store, {
      id: generateId("EVT-task"),
      timestamp: now,
      category: "task",
      summary: `${task.id} created and assigned to ${AGENT_NAME_BY_ID[assignedAgent]}.`,
      entities: [task.id, assignedAgent],
    });
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const task = store.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const previousAgent = task.assignedAgent;
    const nextAgent = req.body.assignedAgent || previousAgent;
    const handoffs = [...(task.handoffs || [])];
    if (nextAgent !== previousAgent) {
      handoffs.push({
        from: previousAgent,
        to: nextAgent,
        at: nowIso(),
        note: req.body.handoffNote || "Manual reassignment via API.",
      });
    }
    const updated = { ...task, ...req.body, handoffs, updatedAt: nowIso() };
    store.upsertTask(updated);
    store.appendChange("task", updated.id, "update", updated, updated.updatedAt);

    addEvent(store, {
      id: generateId("EVT-task"),
      timestamp: nowIso(),
      category: "task",
      summary: `${updated.id} updated via API.`,
      entities: [updated.id],
    });
    res.json(updated);
  });

  app.get("/api/messages", (_req, res) => {
    res.json(store.listMessages());
  });

  app.post("/api/messages", (req, res) => {
    const message = {
      id: generateId("MSG"),
      from: req.body.from,
      to: req.body.to,
      content: req.body.content,
      taskId: req.body.taskId,
      timestamp: nowIso(),
      type: req.body.type || "query",
    };
    store.upsertMessage(message);
    store.appendChange("message", message.id, "create", message, message.timestamp);

    addEvent(store, {
      id: generateId("EVT-msg"),
      timestamp: message.timestamp,
      category: "message",
      summary: `${AGENT_NAME_BY_ID[message.from]} messaged ${AGENT_NAME_BY_ID[message.to]} on ${message.taskId}.`,
      entities: [message.id, message.taskId],
    });
    res.status(201).json(message);
  });

  app.get("/api/emails", (_req, res) => {
    res.json(store.listEmails());
  });

  app.get("/api/events", (_req, res) => {
    res.json(store.listEvents());
  });

  return {
    app,
    close: () => store.close(),
  };
}

export function startServer({ port = Number(process.env.PORT || 8787), dbPath } = {}) {
  const { app, close } = createApp({ dbPath });
  const server = app.listen(port, () => {
    console.log(`Agent activity API running on http://localhost:${port}`);
  });
  return {
    app,
    close: () => {
      server.close();
      close();
    },
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  startServer();
}
