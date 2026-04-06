import { supabase } from "@/integrations/supabase/client";
import { Agent, AgentMessage, AgentTask, ActivityEvent, EmailActivity, DashboardMetrics } from "@/types/agent-types";
import { getDashboardMetrics } from "@/data/mock-agents";

export interface DashboardSnapshot {
  agents: Agent[];
  tasks: AgentTask[];
  messages: AgentMessage[];
  emails: EmailActivity[];
  events: ActivityEvent[];
  metrics: DashboardMetrics;
  syncedAt: string;
}

type GenericRow = Record<string, unknown>;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  return supabase;
}

async function supportsPayloadJsonTable(table: "agents" | "tasks"): Promise<boolean> {
  const client = requireSupabase();
  const probe = await client.from(table).select("id,payload_json,created_at,updated_at").limit(1);
  return !probe.error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asRecord(row: GenericRow): Record<string, unknown> {
  const payload = row.payload_json;
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as unknown;
      return isRecord(parsed) ? parsed : row;
    } catch {
      return row;
    }
  }
  if (isRecord(payload)) {
    return payload;
  }
  return row;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function asTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return Number.isNaN(Date.parse(value)) ? undefined : value;
}

function mapAgent(row: GenericRow): Agent {
  const payload = asRecord(row);
  const id = asString(payload.id ?? row.id, "");
  const role = asString(payload.role, "Agent");
  const name = asString(payload.name, id || "Unknown Agent");
  const status = asString(payload.status, "idle") as Agent["status"];
  const lastActiveAt =
    asTimestamp(payload.lastActiveAt) ??
    asTimestamp(payload.last_active_at) ??
    asTimestamp(row.updated_at) ??
    new Date().toISOString();

  return {
    id: id as Agent["id"],
    name,
    role,
    status,
    avatarColor: asString(payload.avatarColor ?? payload.avatar_color, "bg-gray-500"),
    capabilities: asStringArray(payload.capabilities),
    currentTaskId: asNullableString(payload.currentTaskId ?? payload.current_task_id),
    lastActiveAt,
  };
}

function mapTask(row: GenericRow): AgentTask {
  const payload = asRecord(row);
  const now = new Date().toISOString();
  const id = asString(payload.id ?? row.id, "");
  const createdAt = asTimestamp(payload.createdAt ?? payload.created_at) ?? asTimestamp(row.created_at) ?? now;
  const updatedAt = asTimestamp(payload.updatedAt ?? payload.updated_at) ?? asTimestamp(row.updated_at) ?? createdAt;
  const completedAt = asTimestamp(payload.completedAt ?? payload.completed_at);

  return {
    id,
    title: asString(payload.title, id || "Untitled task"),
    description: asString(payload.description, ""),
    stage: asNonEmptyString(payload.stage, "josh") as AgentTask["stage"],
    assignedAgent: asNonEmptyString(payload.assignedAgent ?? payload.assigned_agent, "josh") as AgentTask["assignedAgent"],
    status: asNonEmptyString(payload.status, "queued") as AgentTask["status"],
    createdAt,
    updatedAt,
    completedAt,
    handoffs: Array.isArray(payload.handoffs) ? (payload.handoffs as AgentTask["handoffs"]) : [],
  };
}

function mapMessage(row: GenericRow): AgentMessage {
  const payload = asRecord(row);
  const id = asString(payload.id ?? row.id, "");
  const timestamp =
    asTimestamp(payload.timestamp) ??
    asTimestamp(payload.updatedAt ?? payload.updated_at) ??
    asTimestamp(row.updated_at) ??
    new Date().toISOString();

  return {
    id,
    from: asNonEmptyString(payload.from ?? payload.from_agent, "unknown") as AgentMessage["from"],
    to: asNonEmptyString(payload.to ?? payload.to_agent, "unknown") as AgentMessage["to"],
    content: asString(payload.content, ""),
    taskId: asString(payload.taskId ?? payload.task_id, ""),
    timestamp,
    type: asString(payload.type, "query") as AgentMessage["type"],
  };
}

function mapEmail(row: GenericRow): EmailActivity {
  const payload = asRecord(row);
  const id = asString(payload.id ?? row.id, "");
  const timestamp =
    asTimestamp(payload.timestamp) ??
    asTimestamp(payload.updatedAt ?? payload.updated_at) ??
    asTimestamp(row.updated_at) ??
    new Date().toISOString();

  return {
    id,
    subject: asString(payload.subject, ""),
    from: asString(payload.from ?? payload.sender, ""),
    readBy: asNonEmptyString(payload.readBy ?? payload.read_by, "unknown") as EmailActivity["readBy"],
    timestamp,
    action: asString(payload.action, ""),
    status: asString(payload.status, "read") as EmailActivity["status"],
  };
}

function mapEvent(row: GenericRow): ActivityEvent {
  const payload = asRecord(row);
  const id = asString(payload.id ?? row.id, "");
  const timestamp =
    asTimestamp(payload.timestamp) ??
    asTimestamp(payload.updatedAt ?? payload.updated_at) ??
    asTimestamp(row.updated_at) ??
    new Date().toISOString();

  return {
    id,
    timestamp,
    category: asString(payload.category, "task") as ActivityEvent["category"],
    summary: asString(payload.summary, ""),
    entities: asStringArray(payload.entities),
  };
}

export async function getSnapshot(): Promise<DashboardSnapshot> {
  const client = requireSupabase();
  const [agentsRes, tasksRes, messagesRes, emailsRes, eventsRes] = await Promise.all([
    client.from("agents").select("*"),
    client.from("tasks").select("*"),
    client.from("messages").select("*"),
    client.from("emails").select("*"),
    client.from("events").select("*"),
  ]);
  const allErrors = [agentsRes.error, tasksRes.error, messagesRes.error, emailsRes.error, eventsRes.error].filter(Boolean);
  if (allErrors.length > 0) {
    throw new Error(allErrors[0]?.message || "Failed to read Supabase snapshot");
  }

  const sortDesc = (a: GenericRow, b: GenericRow) => {
    const getTime = (row: GenericRow) => {
      const payload = asRecord(row);
      const ts =
        asTimestamp(payload.updatedAt ?? payload.updated_at) ??
        asTimestamp(payload.timestamp) ??
        asTimestamp(payload.createdAt ?? payload.created_at) ??
        asTimestamp(row.updated_at) ??
        asTimestamp(row.created_at) ??
        "1970-01-01T00:00:00.000Z";
      return new Date(ts).getTime();
    };
    return getTime(b) - getTime(a);
  };

  const agents = ((agentsRes.data ?? []) as GenericRow[]).map(mapAgent).sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  const tasks = ((tasksRes.data ?? []) as GenericRow[]).sort(sortDesc).map(mapTask);
  const messages = ((messagesRes.data ?? []) as GenericRow[]).sort(sortDesc).map(mapMessage);
  const emails = ((emailsRes.data ?? []) as GenericRow[]).sort(sortDesc).map(mapEmail);
  const events = ((eventsRes.data ?? []) as GenericRow[]).sort(sortDesc).slice(0, 30).map(mapEvent);

  return {
    agents,
    tasks,
    messages,
    emails,
    events,
    metrics: getDashboardMetrics(tasks, messages, emails),
    syncedAt: new Date().toISOString(),
  };
}

export async function createTask(input: { title: string; description?: string; assignedAgent?: string; status?: string }) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const task: AgentTask = {
    id: `TASK-${Date.now()}`,
    title: input.title,
    description: input.description ?? "",
    stage: (input.assignedAgent ?? "josh") as AgentTask["stage"],
    assignedAgent: (input.assignedAgent ?? "josh") as AgentTask["assignedAgent"],
    status: (input.status ?? "queued") as AgentTask["status"],
    createdAt: now,
    updatedAt: now,
    handoffs: [],
  };
  const hasPayloadJson = await supportsPayloadJsonTable("tasks");
  const { error } = hasPayloadJson
    ? await client.from("tasks").upsert({
      id: task.id,
      payload_json: task,
      created_at: now,
      updated_at: now,
    })
    : await client.from("tasks").insert({
      id: task.id,
      title: task.title,
      description: task.description,
      stage: task.stage,
      assigned_agent: task.assignedAgent,
      status: task.status,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      handoffs: task.handoffs,
      completed_at: null,
    });
  if (error) throw new Error(error.message);
}

export async function updateTask(taskId: string, input: Partial<AgentTask>) {
  const client = requireSupabase();
  const hasPayloadJson = await supportsPayloadJsonTable("tasks");
  let error: { message: string } | null = null;

  if (hasPayloadJson) {
    const existing = await client.from("tasks").select("*").eq("id", taskId).single();
    if (existing.error) throw new Error(existing.error.message);
    const current = mapTask((existing.data ?? {}) as GenericRow);
    const updated: AgentTask = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    const response = await client
      .from("tasks")
      .update({
        payload_json: updated,
        updated_at: updated.updatedAt,
      })
      .eq("id", taskId);
    error = response.error;
  } else {
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.stage !== undefined) updatePayload.stage = input.stage;
    if (input.assignedAgent !== undefined) updatePayload.assigned_agent = input.assignedAgent;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.completedAt !== undefined) updatePayload.completed_at = input.completedAt;
    if (input.handoffs !== undefined) updatePayload.handoffs = input.handoffs;
    const response = await client.from("tasks").update(updatePayload).eq("id", taskId);
    error = response.error;
  }

  if (error) throw new Error(error.message);
}

export async function updateAgent(agentId: string, input: Partial<Agent>) {
  const client = requireSupabase();
  const hasPayloadJson = await supportsPayloadJsonTable("agents");
  let error: { message: string } | null = null;

  if (hasPayloadJson) {
    const existing = await client.from("agents").select("*").eq("id", agentId).single();
    if (existing.error) throw new Error(existing.error.message);
    const current = mapAgent((existing.data ?? {}) as GenericRow);
    const updated: Agent = {
      ...current,
      ...input,
      lastActiveAt: new Date().toISOString(),
    };
    const response = await client
      .from("agents")
      .update({
        payload_json: updated,
        updated_at: updated.lastActiveAt,
      })
      .eq("id", agentId);
    error = response.error;
  } else {
    const updatePayload: Record<string, unknown> = {
      last_active_at: new Date().toISOString(),
    };
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.role !== undefined) updatePayload.role = input.role;
    if (input.currentTaskId !== undefined) updatePayload.current_task_id = input.currentTaskId;
    if (input.capabilities !== undefined) updatePayload.capabilities = input.capabilities;
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.avatarColor !== undefined) updatePayload.avatar_color = input.avatarColor;
    const response = await client.from("agents").update(updatePayload).eq("id", agentId);
    error = response.error;
  }

  if (error) throw new Error(error.message);
}
