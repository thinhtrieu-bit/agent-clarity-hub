/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryLog: string[] = [];
const tables = new Map<string, Map<string, string>>();
let changeId = 0;

function resetState() {
  queryLog.length = 0;
  tables.clear();
  changeId = 0;
}

function getTable(name: string) {
  if (!tables.has(name)) {
    tables.set(name, new Map());
  }
  return tables.get(name)!;
}

vi.mock("node:dns/promises", () => ({
  default: {
    lookup: vi.fn().mockResolvedValue({ address: "127.0.0.1" }),
  },
}));

vi.mock("pg", () => {
  class MockPool {
    async query(text: string, params: unknown[] = []) {
      queryLog.push(text);

      if (text.includes("CREATE TABLE IF NOT EXISTS")) {
        return { rows: [], rowCount: 0 };
      }

      const countMatch = text.match(/SELECT COUNT\(\*\)::int AS c FROM (\w+)/);
      if (countMatch) {
        return { rows: [{ c: getTable(countMatch[1]).size }], rowCount: 1 };
      }

      const insertMatch = text.match(/INSERT INTO (\w+) \(id, payload_json, created_at, updated_at\)/);
      if (insertMatch) {
        const [, table] = insertMatch;
        const [id, payload] = params as [string, string];
        getTable(table).set(id, payload);
        return { rows: [], rowCount: 1 };
      }

      const selectByIdMatch = text.match(/SELECT payload_json::text AS payload_json FROM (\w+) WHERE id = \$1/);
      if (selectByIdMatch) {
        const [, table] = selectByIdMatch;
        const [id] = params as [string];
        const payload = getTable(table).get(id);
        return { rows: payload ? [{ payload_json: payload }] : [], rowCount: payload ? 1 : 0 };
      }

      const selectAllMatch = text.match(/SELECT payload_json::text AS payload_json FROM (\w+) ORDER BY updated_at DESC/);
      if (selectAllMatch) {
        const [, table] = selectAllMatch;
        return {
          rows: Array.from(getTable(table).values()).map((payload_json) => ({ payload_json })),
          rowCount: getTable(table).size,
        };
      }

      if (text.includes("INSERT INTO change_log")) {
        changeId += 1;
        return { rows: [{ id: changeId }], rowCount: 1 };
      }

      if (text.startsWith("UPDATE change_log SET cursor")) {
        return { rows: [], rowCount: 1 };
      }

      if (text.includes("FROM change_log")) {
        return { rows: [], rowCount: 0 };
      }

      throw new Error(`Unhandled query in test double: ${text}`);
    }

    async end() {
      return undefined;
    }
  }

  return { default: { Pool: MockPool } };
});

describe("Postgres-backed store", () => {
  beforeEach(() => {
    resetState();
  });

  it("bootstraps schema on first use without inserting mock seed data", async () => {
    const { createPostgresStore } = await import("../../server/pg-store.js");

    const store = createPostgresStore({ connectionString: "postgresql://postgres:secret@db.example.co:5432/postgres" });
    const [agents, tasks, messages, events] = await Promise.all([
      store.listAgents(),
      store.listTasks(),
      store.listMessages(),
      store.listEvents(),
    ]);

    expect(agents).toEqual([]);
    expect(tasks).toEqual([]);
    expect(messages).toEqual([]);
    expect(events).toEqual([]);
    expect(queryLog.some((entry) => entry.includes("CREATE TABLE IF NOT EXISTS agents"))).toBe(true);
    expect(queryLog.some((entry) => entry.includes("CREATE TABLE IF NOT EXISTS change_log"))).toBe(true);

    await store.close();
  });
});
