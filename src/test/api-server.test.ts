/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { createServer } from "node:http";
import { createStore } from "../../server/db.js";
import { buildSnapshot, createApp, simulateSyncTick } from "../../server/index.js";

function makeDbPath() {
  return join(tmpdir(), `agent-activity-test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
}

describe("OpenClaw-ready SQLite activity store", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    cleanupPaths.forEach((dbPath) => {
      try {
        rmSync(dbPath, { force: true });
      } catch {
        // best-effort cleanup
      }
    });
    cleanupPaths.length = 0;
  });

  it("create operations append change-log entries with monotonic cursor", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const store = createStore({ dbPath });
    const now = new Date().toISOString();

    const task = {
      id: `TASK-${Date.now()}`,
      title: "OpenClaw task",
      description: "created in test",
      stage: "josh",
      assignedAgent: "josh",
      status: "queued",
      createdAt: now,
      updatedAt: now,
      handoffs: [],
    };
    return (async () => {
      await store.upsertTask(task);
      const c1 = await store.appendChange("task", task.id, "create", task, now);

    const message = {
      id: `MSG-${Date.now()}`,
      from: "josh",
      to: "joey",
      content: "handoff for openclaw",
      taskId: task.id,
      timestamp: now,
      type: "handoff",
    };
      await store.upsertMessage(message);
      const c2 = await store.appendChange("message", message.id, "create", message, now);

    expect(Number(c2)).toBeGreaterThan(Number(c1));
      const changes = await store.listChanges({ cursor: "0", limit: 20 });
      expect(changes.items.some((item) => item.entityType === "task" && item.operation === "create")).toBe(true);
      expect(changes.items.some((item) => item.entityType === "message" && item.operation === "create")).toBe(true);
      await store.close();
    })();
  });

  it("update operations append change-log entries and cursor resume works", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const store = createStore({ dbPath });

    return (async () => {
      const firstPage = await store.listChanges({ cursor: "0", limit: 500 });
      const startCursor = firstPage.nextCursor;

      const josh = await store.getAgentById("josh");
      const updatedAgent = { ...josh, status: "waiting", lastActiveAt: new Date().toISOString() };
      await store.upsertAgent(updatedAgent);
      await store.appendChange("agent", updatedAgent.id, "update", updatedAgent, updatedAgent.lastActiveAt);

      const task = (await store.listTasks())[0];
      const updatedTask = { ...task, status: "blocked", updatedAt: new Date().toISOString() };
      await store.upsertTask(updatedTask);
      await store.appendChange("task", updatedTask.id, "update", updatedTask, updatedTask.updatedAt);

      const resumed = await store.listChanges({ cursor: startCursor, limit: 1 });
      expect(resumed.items.length).toBe(1);
      expect(resumed.hasMore).toBe(true);
      const resumedNext = await store.listChanges({ cursor: resumed.nextCursor, limit: 20 });
      expect(
        resumedNext.items.some((item) => item.entityType === "agent" && item.operation === "update") ||
          resumedNext.items.some((item) => item.entityType === "task" && item.operation === "update"),
      ).toBe(true);
      await store.close();
    })();
  });

  it("sync tick mutates persisted entities and appends change events", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const store = createStore({ dbPath });
    return (async () => {
      const before = (await store.listChanges({ cursor: "0", limit: 500 })).items.length;
      await simulateSyncTick(store);
      const after = (await store.listChanges({ cursor: "0", limit: 1000 })).items.length;
      expect(after).toBeGreaterThan(before);
      const snapshot = await buildSnapshot(store);
      expect(snapshot.agents.length).toBeGreaterThan(0);
      expect(snapshot.tasks.length).toBeGreaterThan(0);
      await store.close();
    })();
  });

  it("snapshot reflects durable state after restart with same db file", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);

    const first = createStore({ dbPath });
    const now = new Date().toISOString();
    const durableTask = {
      id: `TASK-${Date.now()}`,
      title: "Durable task",
      description: "must survive restart",
      stage: "steve",
      assignedAgent: "steve",
      status: "queued",
      createdAt: now,
      updatedAt: now,
      handoffs: [],
    };
    return (async () => {
      await first.upsertTask(durableTask);
      await first.appendChange("task", durableTask.id, "create", durableTask, now);
      await first.close();

      const second = createStore({ dbPath });
      const snapshot = await buildSnapshot(second);
      expect(snapshot.tasks.some((task) => task.id === durableTask.id)).toBe(true);
      await second.close();
    })();
  });
});

describe("OpenClaw Express API", () => {
  const cleanupPaths: string[] = [];
  const originalApiKey = process.env.OPENCLAW_API_KEY;
  let server: ReturnType<typeof createServer> | null = null;
  let apiBase = "";

  beforeEach(async () => {
    process.env.OPENCLAW_API_KEY = "test-openclaw-api-key";
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const { app, close } = createApp({ dbPath });
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server!.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to determine test server address");
    }
    apiBase = `http://127.0.0.1:${address.port}`;
    const shutdown = server.close.bind(server);
    server.close = ((callback?: (err?: Error) => void) => {
      close().finally(() => shutdown(callback));
      return server!;
    }) as typeof server.close;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    }
    server = null;
    process.env.OPENCLAW_API_KEY = originalApiKey;
    cleanupPaths.forEach((dbPath) => {
      try {
        rmSync(dbPath, { force: true });
      } catch {
        // best-effort cleanup
      }
    });
    cleanupPaths.length = 0;
  });

  async function request(path: string, init?: RequestInit) {
    const requestHeaders = new Headers(init?.headers);
    const authHeaders = requestHeaders.has("authorization") ? {} : { Authorization: "Bearer test-openclaw-api-key" };
    const response = await fetch(`${apiBase}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...Object.fromEntries(requestHeaders.entries()),
      },
      ...init,
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { response, body };
  }

  it("rejects unauthenticated writes and leaves read endpoints public", async () => {
    const unauthorizedWrite = await request("/api/tasks", {
      method: "POST",
      headers: { Authorization: "" },
      body: JSON.stringify({ title: "Blocked task" }),
    });
    expect(unauthorizedWrite.response.status).toBe(401);
    expect(unauthorizedWrite.body.error).toBe("Unauthorized");

    const publicRead = await fetch(`${apiBase}/api/openclaw/snapshot`);
    expect(publicRead.status).toBe(200);
  });

  it("returns 500 for write routes when OPENCLAW_API_KEY is not configured", async () => {
    delete process.env.OPENCLAW_API_KEY;
    const result = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Needs config" }),
    });

    expect(result.response.status).toBe(500);
    expect(result.body.error).toBe("OPENCLAW_API_KEY is not configured");

    process.env.OPENCLAW_API_KEY = "test-openclaw-api-key";
  });

  it("rejects invalid task creation payloads with 400", async () => {
    const { response, body } = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ assignedAgent: "bad-agent" }),
    });

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details).toContain("title is required");
    expect(body.details.some((detail: string) => detail.includes("assignedAgent"))).toBe(true);
  });

  it("creates tasks, appends change-log entries, and returns the same snapshot from both read endpoints", async () => {
    const createResult = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Inbound OpenClaw task",
        description: "created over REST",
        assignedAgent: "joey",
        status: "queued",
      }),
    });

    expect(createResult.response.status).toBe(201);
    expect(createResult.body.title).toBe("Inbound OpenClaw task");
    expect(createResult.body.assignedAgent).toBe("joey");

    const changesResult = await request("/api/openclaw/changes");
    expect(changesResult.response.status).toBe(200);
    expect(changesResult.body.items.some((item: { entityType: string; operation: string }) => item.entityType === "task" && item.operation === "create")).toBe(true);
    expect(changesResult.body.items.some((item: { entityType: string; operation: string }) => item.entityType === "event")).toBe(true);

    const snapshot = await request("/api/snapshot");
    const openclawSnapshot = await request("/api/openclaw/snapshot");
    expect({
      agents: snapshot.body.agents,
      tasks: snapshot.body.tasks,
      messages: snapshot.body.messages,
      emails: snapshot.body.emails,
      events: snapshot.body.events,
      metrics: snapshot.body.metrics,
    }).toEqual({
      agents: openclawSnapshot.body.agents,
      tasks: openclawSnapshot.body.tasks,
      messages: openclawSnapshot.body.messages,
      emails: openclawSnapshot.body.emails,
      events: openclawSnapshot.body.events,
      metrics: openclawSnapshot.body.metrics,
    });
    expect(snapshot.body.syncedAt).toEqual(expect.any(String));
    expect(openclawSnapshot.body.syncedAt).toEqual(expect.any(String));
    expect(snapshot.body.tasks.some((task: { title: string }) => task.title === "Inbound OpenClaw task")).toBe(true);
  });

  it("updates tasks with reassignment handoffs and supports change cursor resume", async () => {
    const createResult = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Reassign me",
        assignedAgent: "josh",
      }),
    });
    const taskId = createResult.body.id as string;

    const firstChanges = await request("/api/openclaw/changes?cursor=0&limit=1");
    expect(firstChanges.body.items.length).toBe(1);
    expect(firstChanges.body.hasMore).toBe(true);

    const updateResult = await request(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({
        assignedAgent: "steve",
        handoffNote: "OpenClaw escalated to Steve.",
        status: "in_progress",
      }),
    });

    expect(updateResult.response.status).toBe(200);
    expect(updateResult.body.assignedAgent).toBe("steve");
    expect(updateResult.body.stage).toBe("steve");
    expect(updateResult.body.handoffs.at(-1)).toMatchObject({
      from: "josh",
      to: "steve",
      note: "OpenClaw escalated to Steve.",
    });

    const resumed = await request(`/api/openclaw/changes?cursor=${firstChanges.body.nextCursor}&limit=20`);
    expect(resumed.body.items.some((item: { entityType: string; operation: string; entityId: string }) => item.entityType === "task" && item.operation === "update" && item.entityId === taskId)).toBe(true);
  });

  it("validates messages, creates message events, and records agent updates", async () => {
    const invalidMessage = await request("/api/messages", {
      method: "POST",
      body: JSON.stringify({ from: "josh" }),
    });
    expect(invalidMessage.response.status).toBe(400);
    expect(invalidMessage.body.details).toContain("to is required");

    const taskResult = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Message target", assignedAgent: "josh" }),
    });

    const messageResult = await request("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        from: "josh",
        to: "joey",
        content: "Passing this task along.",
        taskId: taskResult.body.id,
        type: "handoff",
      }),
    });
    expect(messageResult.response.status).toBe(201);
    expect(messageResult.body.type).toBe("handoff");

    const agentResult = await request("/api/agents/josh", {
      method: "PATCH",
      body: JSON.stringify({
        status: "active",
        currentTaskId: taskResult.body.id,
      }),
    });
    expect(agentResult.response.status).toBe(200);
    expect(agentResult.body.status).toBe("active");

    const eventsResult = await request("/api/events");
    expect(eventsResult.body.some((event: { category: string; summary: string }) => event.category === "message" && event.summary.includes("messaged"))).toBe(true);
    expect(eventsResult.body.some((event: { category: string; summary: string }) => event.category === "agent" && event.summary.includes("updated via API"))).toBe(true);
  });
});
