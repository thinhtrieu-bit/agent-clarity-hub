import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function parseEnv(path) {
  const entries = fs
    .readFileSync(path, "utf8")
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      const key = line.slice(0, idx);
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return [key, value];
    });
  return Object.fromEntries(entries);
}

const env = parseEnv(".env");
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log(JSON.stringify({ error: "Missing VITE_SUPABASE_URL or publishable/anon key" }, null, 2));
  process.exit(0);
}

const sb = createClient(url, key);
const countRes = await sb.from("agents").select("*", { head: true, count: "exact" });
const listRes = await sb.from("agents").select("*").order("last_active_at", { ascending: false }).limit(20);

console.log(
  JSON.stringify(
    {
      count: countRes.count ?? null,
      countError: countRes.error?.message ?? null,
      listError: listRes.error?.message ?? null,
      sample:
        listRes.data?.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          status: row.status,
          last_active_at: row.last_active_at,
        })) ?? [],
    },
    null,
    2,
  ),
);
