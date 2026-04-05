import pg from "pg";
import dns from "node:dns/promises";
import { SEED_AGENTS, SEED_EMAILS, SEED_EVENTS, SEED_MESSAGES, SEED_TASKS } from "./seed-data.js";

const { Pool } = pg;

function parseRows(rows) {
  return rows.map((row) => JSON.parse(row.payload_json));
}

function nowIso() {
  return new Date().toISOString();
}

export function createPostgresStore({ connectionString }) {
  const parsed = new URL(connectionString);
  const forceIpv4 = process.env.PG_FORCE_IPV4 !== "false";
  const resolvedHostPromise = forceIpv4 ? dns.lookup(parsed.hostname, { family: 4 }).catch(() => null) : Promise.resolve(null);
  const poolPromise = (async () => {
    const ipv4 = await resolvedHostPromise;
    const pool = new Pool({
      host: ipv4?.address || parsed.hostname,
      servername: parsed.hostname,
      port: Number(parsed.port || 5432),
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      user: decodeURIComponent(parsed.username || "postgres"),
      password: decodeURIComponent(parsed.password || ""),
      ssl: { rejectUnauthorized: false },
      ...(forceIpv4 ? { family: 4 } : {}),
    });
    return pool;
  })();

  let initPromise = null;

  const withPool = async (fn) => {
    const pool = await poolPromise;
    return fn(pool);
  };

  const upsertById = async (table, value) => {
    const ts = nowIso();
    await withPool((pool) =>
      pool.query(
      `
        INSERT INTO ${table} (id, payload_json, created_at, updated_at)
        VALUES ($1, $2, $3, $3)
        ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
      `,
      [value.id, JSON.stringify(value), ts],
      ),
    );
    return value;
  };

  const appendChange = async (entityType, entityId, operation, payload, createdAt = nowIso()) => {
    const insertRes = await withPool((pool) =>
      pool.query(
      `
        INSERT INTO change_log (cursor, entity_type, entity_id, operation, payload_json, created_at)
        VALUES (NULL, $1, $2, $3, $4, $5)
        RETURNING id
      `,
      [entityType, entityId, operation, JSON.stringify(payload), createdAt],
      ),
    );
    const id = insertRes.rows[0].id;
    const cursor = String(id);
    await withPool((pool) => pool.query(`UPDATE change_log SET cursor = $1 WHERE id = $2`, [cursor, id]));
    return cursor;
  };

  const init = async () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      await withPool((pool) =>
        pool.query(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS change_log (
          id BIGSERIAL PRIMARY KEY,
          cursor TEXT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
      `),
      );

      const count = async (table) => {
        const res = await withPool((pool) => pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`));
        return res.rows[0].c;
      };

      if ((await count("agents")) === 0) await Promise.all(SEED_AGENTS.map((item) => upsertById("agents", item)));
      if ((await count("tasks")) === 0) await Promise.all(SEED_TASKS.map((item) => upsertById("tasks", item)));
      if ((await count("messages")) === 0) await Promise.all(SEED_MESSAGES.map((item) => upsertById("messages", item)));
      if ((await count("emails")) === 0) await Promise.all(SEED_EMAILS.map((item) => upsertById("emails", item)));
      if ((await count("events")) === 0) await Promise.all(SEED_EVENTS.map((item) => upsertById("events", item)));
    })();
    return initPromise;
  };

  const listByTable = async (table) => {
    await init();
    const res = await withPool((pool) => pool.query(`SELECT payload_json::text AS payload_json FROM ${table} ORDER BY updated_at DESC`));
    return parseRows(res.rows);
  };

  const getById = async (table, id) => {
    await init();
    const res = await withPool((pool) => pool.query(`SELECT payload_json::text AS payload_json FROM ${table} WHERE id = $1`, [id]));
    return res.rowCount ? JSON.parse(res.rows[0].payload_json) : null;
  };

  return {
    close: async () => {
      const pool = await poolPromise;
      await pool.end();
    },
    listAgents: async () => listByTable("agents"),
    listTasks: async () => listByTable("tasks"),
    listMessages: async () => listByTable("messages"),
    listEmails: async () => listByTable("emails"),
    listEvents: async () => listByTable("events"),
    getAgentById: async (id) => getById("agents", id),
    getTaskById: async (id) => getById("tasks", id),
    upsertAgent: async (agent) => {
      await init();
      return upsertById("agents", agent);
    },
    upsertTask: async (task) => {
      await init();
      return upsertById("tasks", task);
    },
    upsertMessage: async (message) => {
      await init();
      return upsertById("messages", message);
    },
    upsertEmail: async (email) => {
      await init();
      return upsertById("emails", email);
    },
    upsertEvent: async (event) => {
      await init();
      return upsertById("events", event);
    },
    appendChange: async (...args) => {
      await init();
      return appendChange(...args);
    },
    listChanges: async ({ cursor = "0", limit = 100 }) => {
      await init();
      const numericCursor = Number(cursor) > 0 ? Number(cursor) : 0;
      const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
      const res = await withPool((pool) =>
        pool.query(
        `
          SELECT id, cursor, entity_type, entity_id, operation, payload_json::text AS payload_json, created_at
          FROM change_log
          WHERE id > $1
          ORDER BY id ASC
          LIMIT $2
        `,
        [numericCursor, safeLimit + 1],
        ),
      );
      const rows = res.rows;
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
