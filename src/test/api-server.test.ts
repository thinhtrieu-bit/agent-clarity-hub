/* @vitest-environment node */
import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { createStore } from "../../server/db.js";
import { buildSnapshot, simulateSyncTick } from "../../server/index.js";

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
    store.upsertTask(task);
    const c1 = store.appendChange("task", task.id, "create", task, now);

    const message = {
      id: `MSG-${Date.now()}`,
      from: "josh",
      to: "joey",
      content: "handoff for openclaw",
      taskId: task.id,
      timestamp: now,
      type: "handoff",
    };
    store.upsertMessage(message);
    const c2 = store.appendChange("message", message.id, "create", message, now);

    expect(Number(c2)).toBeGreaterThan(Number(c1));
    const changes = store.listChanges({ cursor: "0", limit: 20 });
    expect(changes.items.some((item) => item.entityType === "task" && item.operation === "create")).toBe(true);
    expect(changes.items.some((item) => item.entityType === "message" && item.operation === "create")).toBe(true);
    store.close();
  });

  it("update operations append change-log entries and cursor resume works", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const store = createStore({ dbPath });

    const firstPage = store.listChanges({ cursor: "0", limit: 500 });
    const startCursor = firstPage.nextCursor;

    const josh = store.getAgentById("josh");
    const updatedAgent = { ...josh, status: "waiting", lastActiveAt: new Date().toISOString() };
    store.upsertAgent(updatedAgent);
    store.appendChange("agent", updatedAgent.id, "update", updatedAgent, updatedAgent.lastActiveAt);

    const task = store.listTasks()[0];
    const updatedTask = { ...task, status: "blocked", updatedAt: new Date().toISOString() };
    store.upsertTask(updatedTask);
    store.appendChange("task", updatedTask.id, "update", updatedTask, updatedTask.updatedAt);

    const resumed = store.listChanges({ cursor: startCursor, limit: 1 });
    expect(resumed.items.length).toBe(1);
    expect(resumed.hasMore).toBe(true);
    const resumedNext = store.listChanges({ cursor: resumed.nextCursor, limit: 20 });
    expect(
      resumedNext.items.some((item) => item.entityType === "agent" && item.operation === "update") ||
        resumedNext.items.some((item) => item.entityType === "task" && item.operation === "update"),
    ).toBe(true);
    store.close();
  });

  it("sync tick mutates persisted entities and appends change events", () => {
    const dbPath = makeDbPath();
    cleanupPaths.push(dbPath);
    const store = createStore({ dbPath });
    const before = store.listChanges({ cursor: "0", limit: 500 }).items.length;

    simulateSyncTick(store);

    const after = store.listChanges({ cursor: "0", limit: 1000 }).items.length;
    expect(after).toBeGreaterThan(before);
    const snapshot = buildSnapshot(store);
    expect(snapshot.agents.length).toBeGreaterThan(0);
    expect(snapshot.tasks.length).toBeGreaterThan(0);
    store.close();
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
    first.upsertTask(durableTask);
    first.appendChange("task", durableTask.id, "create", durableTask, now);
    first.close();

    const second = createStore({ dbPath });
    const snapshot = buildSnapshot(second);
    expect(snapshot.tasks.some((task) => task.id === durableTask.id)).toBe(true);
    second.close();
  });
});
