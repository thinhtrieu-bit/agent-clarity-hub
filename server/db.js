import Database from "better-sqlite3";
import {
  SEED_AGENTS,
  SEED_EMAILS,
  SEED_EVENTS,
  SEED_MESSAGES,
  SEED_TASKS,
} from "./seed-data.js";

function nowIso() {
  return new Date().toISOString();
}

function parseRows(rows) {
  return rows.map((row) => JSON.parse(row.payload_json));
}

export function createStore({ dbPath = process.env.AGENT_DB_PATH || "server/agent-activity.sqlite" } = {}) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS change_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cursor TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const countTable = (name) => db.prepare(`SELECT COUNT(*) AS c FROM ${name}`).get().c;

  const upsertByIdStmt = (table) =>
    db.prepare(`
      INSERT INTO ${table} (id, payload_json, created_at, updated_at)
      VALUES (@id, @payload_json, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
    `);

  const writeChangeStmt = db.prepare(`
    INSERT INTO change_log (cursor, entity_type, entity_id, operation, payload_json, created_at)
    VALUES (NULL, ?, ?, ?, ?, ?)
  `);
  const fillCursorStmt = db.prepare(`UPDATE change_log SET cursor = ? WHERE id = ?`);

  const putEntity = (table, value) => {
    const ts = nowIso();
    upsertByIdStmt(table).run({
      id: value.id,
      payload_json: JSON.stringify(value),
      created_at: ts,
      updated_at: ts,
    });
    return value;
  };

  const appendChange = (entityType, entityId, operation, payload, createdAt = nowIso()) => {
    const info = writeChangeStmt.run(entityType, entityId, operation, JSON.stringify(payload), createdAt);
    const cursor = String(info.lastInsertRowid);
    fillCursorStmt.run(cursor, info.lastInsertRowid);
    return cursor;
  };

  const seedIfEmpty = () => {
    if (!countTable("agents")) SEED_AGENTS.forEach((item) => putEntity("agents", item));
    if (!countTable("tasks")) SEED_TASKS.forEach((item) => putEntity("tasks", item));
    if (!countTable("messages")) SEED_MESSAGES.forEach((item) => putEntity("messages", item));
    if (!countTable("emails")) SEED_EMAILS.forEach((item) => putEntity("emails", item));
    if (!countTable("events")) SEED_EVENTS.forEach((item) => putEntity("events", item));
  };
  seedIfEmpty();

  const selectAllDescByUpdated = (table) =>
    parseRows(db.prepare(`SELECT payload_json FROM ${table} ORDER BY datetime(updated_at) DESC`).all());
  const selectById = (table, id) => {
    const row = db.prepare(`SELECT payload_json FROM ${table} WHERE id = ?`).get(id);
    return row ? JSON.parse(row.payload_json) : null;
  };

  return {
    close: () => db.close(),
    listAgents: () => selectAllDescByUpdated("agents"),
    listTasks: () => selectAllDescByUpdated("tasks"),
    listMessages: () => selectAllDescByUpdated("messages"),
    listEmails: () => selectAllDescByUpdated("emails"),
    listEvents: () => selectAllDescByUpdated("events"),
    getAgentById: (id) => selectById("agents", id),
    getTaskById: (id) => selectById("tasks", id),
    upsertAgent: (agent) => putEntity("agents", agent),
    upsertTask: (task) => putEntity("tasks", task),
    upsertMessage: (message) => putEntity("messages", message),
    upsertEmail: (email) => putEntity("emails", email),
    upsertEvent: (event) => putEntity("events", event),
    appendChange,
    listChanges: ({ cursor = "0", limit = 100 }) => {
      const numericCursor = Number(cursor) > 0 ? Number(cursor) : 0;
      const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
      const rows = db
        .prepare(
          `
            SELECT id, cursor, entity_type, entity_id, operation, payload_json, created_at
            FROM change_log
            WHERE id > ?
            ORDER BY id ASC
            LIMIT ?
          `,
        )
        .all(numericCursor, safeLimit + 1);

      const hasMore = rows.length > safeLimit;
      const usedRows = hasMore ? rows.slice(0, safeLimit) : rows;
      const items = usedRows.map((row) => ({
        cursor: row.cursor || String(row.id),
        entityType: row.entity_type,
        entityId: row.entity_id,
        operation: row.operation,
        payload: JSON.parse(row.payload_json),
        timestamp: row.created_at,
      }));
      const nextCursor = items.length ? items[items.length - 1].cursor : String(numericCursor);
      return { items, nextCursor, hasMore };
    },
  };
}
