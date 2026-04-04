import { Agent, AgentMessage, AgentTask } from "@/types/agent-types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";

export interface DashboardSnapshot {
  agents: Agent[];
  tasks: AgentTask[];
  messages: AgentMessage[];
  emails: {
    id: string;
    subject: string;
    from: string;
    readBy: "josh" | "joey" | "steve" | "hulk";
    timestamp: string;
    action: string;
    status: "read" | "processed" | "flagged" | "ignored";
  }[];
  events: {
    id: string;
    timestamp: string;
    category: "agent" | "task" | "message" | "email";
    summary: string;
    entities: string[];
  }[];
  metrics: {
    tasksCompletedToday: number;
    avgPipelineTimeMinutes: number;
    activeConversations: number;
    emailsProcessed: number;
  };
  syncedAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getSnapshot() {
  return request<DashboardSnapshot>("/snapshot");
}

export function syncActivity() {
  return request<DashboardSnapshot>("/sync/activity", { method: "POST" });
}

export function createTask(input: { title: string; description?: string; assignedAgent?: string; status?: string }) {
  return request<AgentTask>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(taskId: string, input: Partial<AgentTask>) {
  return request<AgentTask>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateAgent(agentId: string, input: Partial<Agent>) {
  return request<Agent>(`/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
