import { Agent, AgentMessage, AgentTask, ActivityEvent, EmailActivity, DashboardMetrics } from "@/types/agent-types";

export interface DashboardSnapshot {
  agents: Agent[];
  tasks: AgentTask[];
  messages: AgentMessage[];
  emails: EmailActivity[];
  events: ActivityEvent[];
  metrics: DashboardMetrics;
  syncedAt: string;
}

type RequestOptions = {
  auth?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:8787/api";
  }
  return "/api";
}

function getWriteAuthHeader() {
  const key = import.meta.env.VITE_OPENCLAW_API_KEY as string | undefined;
  if (!key || key.trim().length === 0) {
    return null;
  }
  return `Bearer ${key}`;
}

async function requestJson<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (options?.auth) {
    const auth = getWriteAuthHeader();
    if (!auth) {
      throw new Error("VITE_OPENCLAW_API_KEY is required for write actions");
    }
    headers.set("Authorization", auth);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) {
        errorMessage = body.error;
      }
      if (Array.isArray(body?.details) && body.details.length > 0) {
        errorMessage = `${errorMessage}: ${body.details.join(", ")}`;
      }
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

function buildMetrics(tasks: AgentTask[], messages: AgentMessage[], emails: EmailActivity[]): DashboardMetrics {
  const completed = tasks.filter((task) => Boolean(task.completedAt));
  const durations = completed.map(
    (task) => (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60),
  );
  const avgPipelineTimeMinutes = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  return {
    tasksCompletedToday: completed.length,
    avgPipelineTimeMinutes,
    activeConversations: new Set(messages.map((message) => `${message.from}-${message.to}-${message.taskId}`)).size,
    emailsProcessed: emails.filter((email) => email.status === "processed").length,
  };
}

function normalizeSnapshot(input: Partial<DashboardSnapshot>): DashboardSnapshot {
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const emails = Array.isArray(input.emails) ? input.emails : [];

  return {
    agents: Array.isArray(input.agents) ? input.agents : [],
    tasks,
    messages,
    emails,
    events: Array.isArray(input.events) ? input.events : [],
    metrics: input.metrics ?? buildMetrics(tasks, messages, emails),
    syncedAt: typeof input.syncedAt === "string" ? input.syncedAt : nowIso(),
  };
}

export async function getSnapshot(): Promise<DashboardSnapshot> {
  const snapshot = await requestJson<DashboardSnapshot>("/snapshot");
  return normalizeSnapshot(snapshot);
}

export async function createTask(input: { title: string; description?: string; assignedAgent?: string; status?: string }) {
  await requestJson<AgentTask>(
    "/tasks",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: true },
  );
}

export async function updateTask(taskId: string, input: Partial<AgentTask>) {
  await requestJson<AgentTask>(
    `/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    { auth: true },
  );
}

export async function updateAgent(agentId: string, input: Partial<Agent>) {
  await requestJson<Agent>(
    `/agents/${encodeURIComponent(agentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    { auth: true },
  );
}
