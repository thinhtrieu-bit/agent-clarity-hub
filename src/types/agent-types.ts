export type AgentId = "josh" | "joey" | "steve" | "hulk";

export type AgentStatus = "idle" | "active" | "waiting";

export type TaskStage = "josh" | "joey" | "steve" | "hulk";

export type TaskStatus = "queued" | "in_progress" | "waiting" | "blocked" | "completed";

export type MessageType = "handoff" | "query" | "response";

export type EmailStatus = "read" | "processed" | "flagged" | "ignored";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  avatarColor: string;
  capabilities: string[];
  currentTaskId?: string;
  lastActiveAt: string;
}

export interface TaskHandoff {
  from: AgentId;
  to: AgentId;
  at: string;
  note: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  assignedAgent: AgentId;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  handoffs: TaskHandoff[];
}

export interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId;
  content: string;
  taskId: string;
  timestamp: string;
  type: MessageType;
}

export interface EmailActivity {
  id: string;
  subject: string;
  from: string;
  readBy: AgentId;
  timestamp: string;
  action: string;
  status: EmailStatus;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  category: "agent" | "task" | "message" | "email";
  summary: string;
  entities: string[];
}

export interface DashboardMetrics {
  tasksCompletedToday: number;
  avgPipelineTimeMinutes: number;
  activeConversations: number;
  emailsProcessed: number;
}
