import cors from "cors";
import express from "express";
import { pathToFileURL } from "node:url";
import { createStore } from "./store-factory.js";
import { AGENT_NAME_BY_ID, STAGE_ORDER } from "./seed-data.js";

const AGENT_IDS = new Set(STAGE_ORDER);
const AGENT_STATUSES = new Set(["idle", "active", "waiting"]);
const TASK_STATUSES = new Set(["queued", "in_progress", "waiting", "blocked", "completed"]);
const MESSAGE_TYPES = new Set(["handoff", "query", "response"]);

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

export async function buildSnapshot(store) {
  const agents = await store.listAgents();
  const tasks = await store.listTasks();
  const messages = await store.listMessages();
  const emails = await store.listEmails();
  const events = await store.listEvents();

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

async function addEvent(store, event) {
  await store.upsertEvent(event);
  await store.appendChange("event", event.id, "sync", event, event.timestamp || nowIso());
}

function createTaskFilter(query) {
  return (task) => {
    const byAgent = typeof query.agent === "string" ? task.assignedAgent === query.agent : true;
    const byStatus = typeof query.status === "string" ? task.status === query.status : true;
    return byAgent && byStatus;
  };
}

export async function simulateSyncTick(store) {
  const now = nowIso();
  const randomAgent = STAGE_ORDER[Math.floor(Math.random() * STAGE_ORDER.length)];
  const agents = await store.listAgents();
  const tasks = await store.listTasks();

  await Promise.all(
    agents.map(async (agent) => {
      const nextAgent =
        agent.id === randomAgent
          ? { ...agent, status: "active", lastActiveAt: now }
          : agent.status === "active"
            ? { ...agent, status: "waiting" }
            : agent;
      await store.upsertAgent(nextAgent);
      await store.appendChange("agent", nextAgent.id, "sync", nextAgent, now);
    }),
  );

  await addEvent(store, {
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
    await store.upsertTask(completedTask);
    await store.appendChange("task", completedTask.id, "sync", completedTask, now);
    await addEvent(store, {
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
  await store.upsertTask(updatedTask);
  await store.appendChange("task", updatedTask.id, "sync", updatedTask, now);

  const message = {
    id: generateId("MSG"),
    from: STAGE_ORDER[currentIndex],
    to: nextStage,
    content: `${movingTask.id} synced and handed to ${AGENT_NAME_BY_ID[nextStage]}.`,
    taskId: movingTask.id,
    timestamp: now,
    type: "handoff",
  };
  await store.upsertMessage(message);
  await store.appendChange("message", message.id, "sync", message, now);

  await addEvent(store, {
    id: generateId("EVT-task"),
    timestamp: now,
    category: "task",
    summary: `${movingTask.id} moved ${AGENT_NAME_BY_ID[STAGE_ORDER[currentIndex]]} -> ${AGENT_NAME_BY_ID[nextStage]}.`,
    entities: [movingTask.id, STAGE_ORDER[currentIndex], nextStage],
  });
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validateRequiredString(value, field, errors) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} is required`);
    return null;
  }
  return value.trim();
}

function validateOptionalString(value, field, errors) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  return value;
}

function validateEnum(value, field, allowedValues, errors, { required = false } = {}) {
  if (value === undefined) {
    if (required) {
      errors.push(`${field} is required`);
    }
    return undefined;
  }
  if (typeof value !== "string" || !allowedValues.has(value)) {
    errors.push(`${field} must be one of: ${Array.from(allowedValues).join(", ")}`);
    return undefined;
  }
  return value;
}

function validateOptionalTimestamp(value, field, errors) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push(`${field} must be a valid ISO timestamp`);
    return undefined;
  }
  return value;
}

function validateOptionalStringArray(value, field, errors) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${field} must be an array of strings`);
    return undefined;
  }
  return value;
}

function validateOptionalHandoffs(value, errors) {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some(
      (handoff) =>
        !handoff ||
        typeof handoff !== "object" ||
        !AGENT_IDS.has(handoff.from) ||
        !AGENT_IDS.has(handoff.to) ||
        typeof handoff.note !== "string" ||
        typeof handoff.at !== "string" ||
        Number.isNaN(Date.parse(handoff.at)),
    )
  ) {
    errors.push("handoffs must be an array of valid handoff objects");
    return undefined;
  }
  return value;
}

function sendValidationError(res, errors) {
  res.status(400).json({
    error: "Invalid request payload",
    details: errors,
  });
}

export function createApp({ dbPath, supabaseDbUrl } = {}) {
  const app = express();
  const store = createStore({ dbPath, supabaseDbUrl });
  app.locals.store = store;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/snapshot", asyncRoute(async (_req, res) => {
    res.json(await buildSnapshot(store));
  }));

  app.get("/api/openclaw/snapshot", asyncRoute(async (_req, res) => {
    res.json(await buildSnapshot(store));
  }));

  app.get("/api/openclaw/changes", asyncRoute(async (req, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "0";
    const limit = typeof req.query.limit === "string" ? req.query.limit : "100";
    const changes = await store.listChanges({ cursor, limit });
    res.json({
      items: changes.items,
      nextCursor: changes.nextCursor,
      hasMore: changes.hasMore,
      serverTime: nowIso(),
    });
  }));

  app.post("/api/sync/activity", asyncRoute(async (_req, res) => {
    await simulateSyncTick(store);
    res.json(await buildSnapshot(store));
  }));

  app.get("/api/agents", asyncRoute(async (_req, res) => {
    res.json(await store.listAgents());
  }));

  app.patch("/api/agents/:id", asyncRoute(async (req, res) => {
    const errors = [];
    const status = validateEnum(req.body.status, "status", AGENT_STATUSES, errors);
    const name = validateOptionalString(req.body.name, "name", errors);
    const role = validateOptionalString(req.body.role, "role", errors);
    const avatarColor = validateOptionalString(req.body.avatarColor, "avatarColor", errors);
    const currentTaskId = validateOptionalString(req.body.currentTaskId, "currentTaskId", errors);
    const lastActiveAt = validateOptionalTimestamp(req.body.lastActiveAt, "lastActiveAt", errors);
    const capabilities = validateOptionalStringArray(req.body.capabilities, "capabilities", errors);
    if (errors.length > 0) {
      sendValidationError(res, errors);
      return;
    }

    const agent = await store.getAgentById(req.params.id);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    const updated = {
      ...agent,
      ...(status !== undefined ? { status } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(avatarColor !== undefined ? { avatarColor } : {}),
      ...(currentTaskId !== undefined ? { currentTaskId } : {}),
      ...(capabilities !== undefined ? { capabilities } : {}),
      lastActiveAt: lastActiveAt ?? nowIso(),
    };
    await store.upsertAgent(updated);
    await store.appendChange("agent", updated.id, "update", updated, updated.lastActiveAt);

    await addEvent(store, {
      id: generateId("EVT-agent"),
      timestamp: nowIso(),
      category: "agent",
      summary: `${updated.name} updated via API.`,
      entities: [updated.id],
    });
    res.json(updated);
  }));

  app.get("/api/tasks", asyncRoute(async (req, res) => {
    const tasks = (await store.listTasks()).filter(createTaskFilter(req.query));
    res.json(tasks);
  }));

  app.post("/api/tasks", asyncRoute(async (req, res) => {
    const errors = [];
    const title = validateRequiredString(req.body.title, "title", errors);
    const description = validateOptionalString(req.body.description, "description", errors);
    const assignedAgent = validateEnum(req.body.assignedAgent ?? "josh", "assignedAgent", AGENT_IDS, errors, {
      required: true,
    });
    const status = validateEnum(req.body.status ?? "queued", "status", TASK_STATUSES, errors, { required: true });
    if (errors.length > 0 || !title || !assignedAgent || !status) {
      sendValidationError(res, errors);
      return;
    }

    const now = nowIso();
    const task = {
      id: generateId("TASK"),
      title,
      description: description ?? "",
      stage: assignedAgent,
      assignedAgent,
      status,
      createdAt: now,
      updatedAt: now,
      handoffs: [],
    };
    await store.upsertTask(task);
    await store.appendChange("task", task.id, "create", task, now);

    await addEvent(store, {
      id: generateId("EVT-task"),
      timestamp: now,
      category: "task",
      summary: `${task.id} created and assigned to ${AGENT_NAME_BY_ID[assignedAgent]}.`,
      entities: [task.id, assignedAgent],
    });
    res.status(201).json(task);
  }));

  app.patch("/api/tasks/:id", asyncRoute(async (req, res) => {
    const errors = [];
    const title = validateOptionalString(req.body.title, "title", errors);
    const description = validateOptionalString(req.body.description, "description", errors);
    const assignedAgent = validateEnum(req.body.assignedAgent, "assignedAgent", AGENT_IDS, errors);
    const stage = validateEnum(req.body.stage, "stage", AGENT_IDS, errors);
    const status = validateEnum(req.body.status, "status", TASK_STATUSES, errors);
    const completedAt = validateOptionalTimestamp(req.body.completedAt, "completedAt", errors);
    const handoffs = validateOptionalHandoffs(req.body.handoffs, errors);
    const handoffNote = validateOptionalString(req.body.handoffNote, "handoffNote", errors);
    if (errors.length > 0) {
      sendValidationError(res, errors);
      return;
    }

    const task = await store.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const previousAgent = task.assignedAgent;
    const nextAgent = assignedAgent || previousAgent;
    const nextHandoffs = [...(handoffs || task.handoffs || [])];
    if (nextAgent !== previousAgent) {
      nextHandoffs.push({
        from: previousAgent,
        to: nextAgent,
        at: nowIso(),
        note: handoffNote || "Manual reassignment via API.",
      });
    }
    const updated = {
      ...task,
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(assignedAgent !== undefined ? { assignedAgent } : {}),
      ...(stage !== undefined ? { stage } : assignedAgent !== undefined ? { stage: assignedAgent } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
      handoffs: nextHandoffs,
      updatedAt: nowIso(),
    };
    await store.upsertTask(updated);
    await store.appendChange("task", updated.id, "update", updated, updated.updatedAt);

    await addEvent(store, {
      id: generateId("EVT-task"),
      timestamp: nowIso(),
      category: "task",
      summary: `${updated.id} updated via API.`,
      entities: [updated.id],
    });
    res.json(updated);
  }));

  app.get("/api/messages", asyncRoute(async (_req, res) => {
    res.json(await store.listMessages());
  }));

  app.post("/api/messages", asyncRoute(async (req, res) => {
    const errors = [];
    const from = validateEnum(req.body.from, "from", AGENT_IDS, errors, { required: true });
    const to = validateEnum(req.body.to, "to", AGENT_IDS, errors, { required: true });
    const content = validateRequiredString(req.body.content, "content", errors);
    const taskId = validateRequiredString(req.body.taskId, "taskId", errors);
    const type = validateEnum(req.body.type ?? "query", "type", MESSAGE_TYPES, errors, { required: true });
    if (errors.length > 0 || !from || !to || !content || !taskId || !type) {
      sendValidationError(res, errors);
      return;
    }

    const message = {
      id: generateId("MSG"),
      from,
      to,
      content,
      taskId,
      timestamp: nowIso(),
      type,
    };
    await store.upsertMessage(message);
    await store.appendChange("message", message.id, "create", message, message.timestamp);

    await addEvent(store, {
      id: generateId("EVT-msg"),
      timestamp: message.timestamp,
      category: "message",
      summary: `${AGENT_NAME_BY_ID[message.from]} messaged ${AGENT_NAME_BY_ID[message.to]} on ${message.taskId}.`,
      entities: [message.id, message.taskId],
    });
    res.status(201).json(message);
  }));

  app.get("/api/emails", asyncRoute(async (_req, res) => {
    res.json(await store.listEmails());
  }));

  app.get("/api/events", asyncRoute(async (_req, res) => {
    res.json(await store.listEvents());
  }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error", detail: err?.message || "unknown error" });
  });

  return {
    app,
    close: async () => {
      await store.close();
    },
  };
}

export function startServer({ port = Number(process.env.PORT || 8787), dbPath, supabaseDbUrl } = {}) {
  const { app, close } = createApp({ dbPath, supabaseDbUrl });
  const server = app.listen(port, () => {
    console.log(`Agent activity API running on http://localhost:${port}`);
  });
  return {
    app,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await close();
    },
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  startServer();
}
