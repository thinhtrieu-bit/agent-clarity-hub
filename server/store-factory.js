import { createStore as createSqliteStore } from "./db.js";
import { createPostgresStore } from "./pg-store.js";

function buildSupabaseUrlFromFields() {
  const host = process.env.SUPABASE_DB_HOST;
  const port = process.env.SUPABASE_DB_PORT || "5432";
  const database = process.env.SUPABASE_DB_NAME || "postgres";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!host || !password) return null;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function createStore(options = {}) {
  const supabaseDbUrl =
    options.supabaseDbUrl || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || buildSupabaseUrlFromFields();
  if (supabaseDbUrl) {
    return createPostgresStore({ connectionString: supabaseDbUrl });
  }
  return createSqliteStore(options);
}
