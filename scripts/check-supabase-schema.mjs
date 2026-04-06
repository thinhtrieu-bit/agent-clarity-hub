import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(path) {
  const content = fs.readFileSync(path, "utf8");
  const entries = content
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const eq = line.indexOf("=");
      const key = line.slice(0, eq);
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return [key, value];
    });

  return Object.fromEntries(entries);
}

const env = parseEnvFile(".env");
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("NO_SUPABASE_CLIENT_ENV");
  process.exit(0);
}

const client = createClient(supabaseUrl, supabaseKey);
const tables = ["agents", "tasks", "messages", "emails", "events"];
const out = {};

for (const table of tables) {
  const { data, error } = await client.from(table).select("*").limit(1);
  if (error) {
    out[table] = { error: error.message };
    continue;
  }
  out[table] = {
    rows: data?.length ?? 0,
    columns: data?.[0] ? Object.keys(data[0]) : [],
  };
}

console.log(JSON.stringify(out, null, 2));
