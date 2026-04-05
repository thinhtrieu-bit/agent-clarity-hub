import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";
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

type AgentRow = Tables<"agents">;
type TaskRow = Tables<"tasks">;
type MessageRow = Tables<"messages">;
type EmailRow = Tables<"emails">;
type EventRow = Tables<"events">;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  return supabase;
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status,
    avatarColor: row.avatar_color,
    capabilities: Array.isArray(row.capabilities) ? row.capabilities.filter((value): value is string => typeof value === "string") : [],
    currentTaskId: row.current_task_id ?? undefined,
    lastActiveAt: row.last_active_at,
  };
}

function mapTask(row: TaskRow): AgentTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    stage: row.stage,
    assignedAgent: row.assigned_agent,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    handoffs: Array.isArray(row.handoffs) ? row.handoffs as AgentTask["handoffs"] : [],
  };
}

function mapMessage(row: MessageRow): AgentMessage {
  return {
    id: row.id,
    from: row.from_agent,
    to: row.to_agent,
    content: row.content,
    taskId: row.task_id,
    timestamp: row.timestamp,
    type: row.type,
  };
}

function mapEmail(row: EmailRow): EmailActivity {
  return {
    id: row.id,
    subject: row.subject,
    from: row.sender,
    readBy: row.read_by,
    timestamp: row.timestamp,
    action: row.action,
    status: row.status,
  };
}

function mapEvent(row: EventRow): ActivityEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    category: row.category,
    summary: row.summary,
    entities: Array.isArray(row.entities) ? row.entities.filter((value): value is string => typeof value === "string") : [],
  };
}

export async function getSnapshot(): Promise<DashboardSnapshot> {
  const client = requireSupabase();
  const [agentsRes, tasksRes, messagesRes, emailsRes, eventsRes] = await Promise.all([
    client.from("agents").select("*"),
    client.from("tasks").select("*").order("created_at", { ascending: false }),
    client.from("messages").select("*").order("timestamp", { ascending: false }),
    client.from("emails").select("*").order("timestamp", { ascending: false }),
    client.from("events").select("*").order("timestamp", { ascending: false }).limit(30),
  ]);

  const agents = (agentsRes.data ?? []).map(mapAgent);
  const tasks = (tasksRes.data ?? []).map(mapTask);
  const messages = (messagesRes.data ?? []).map(mapMessage);
  const emails = (emailsRes.data ?? []).map(mapEmail);
  const events = (eventsRes.data ?? []).map(mapEvent);

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
  const id = `TASK-${Date.now()}`;
  const { error } = await client.from("tasks").insert({
    id,
    title: input.title,
    description: input.description ?? "",
    stage: input.assignedAgent ?? "josh",
    assigned_agent: input.assignedAgent ?? "josh",
    status: input.status ?? "queued",
  });
  if (error) throw new Error(error.message);
}

export async function updateTask(taskId: string, input: Partial<AgentTask>) {
  const client = requireSupabase();
  const update: TablesUpdate<"tasks"> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.stage !== undefined) update.stage = input.stage;
  if (input.assignedAgent !== undefined) update.assigned_agent = input.assignedAgent;
  if (input.status !== undefined) update.status = input.status;
  if (input.completedAt !== undefined) update.completed_at = input.completedAt;
  if (input.handoffs !== undefined) update.handoffs = input.handoffs;
  update.updated_at = new Date().toISOString();

  const { error } = await client.from("tasks").update(update).eq("id", taskId);
  if (error) throw new Error(error.message);
}

export async function updateAgent(agentId: string, input: Partial<Agent>) {
  const client = requireSupabase();
  const update: TablesUpdate<"agents"> = {};
  if (input.status !== undefined) update.status = input.status;
  if (input.role !== undefined) update.role = input.role;
  if (input.currentTaskId !== undefined) update.current_task_id = input.currentTaskId;
  if (input.capabilities !== undefined) update.capabilities = input.capabilities;
  update.last_active_at = new Date().toISOString();

  const { error } = await client.from("agents").update(update).eq("id", agentId);
  if (error) throw new Error(error.message);
}
