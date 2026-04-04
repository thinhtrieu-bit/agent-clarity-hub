export type AgentStatus = "active" | "idle" | "waiting" | "error";
export type TaskStage = "josh" | "joey" | "steve" | "hulk" | "completed";
export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";
export type MessageType = "handoff" | "query" | "response" | "system";
export type EmailStatus = "unread" | "read" | "processed" | "flagged" | "ignored";
export type EmailAction = "forwarded" | "replied" | "archived" | "escalated" | "none";

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  avatarColor: string;
  capabilities: string[];
  currentTask: string | null;
  lastActive: Date;
  tasksCompleted: number;
}

export interface TaskHandoff {
  fromAgent: string;
  toAgent: string;
  timestamp: Date;
  notes: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  assignedAgent: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  handoffs: TaskHandoff[];
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  content: string;
  taskId: string | null;
  timestamp: Date;
  type: MessageType;
}

export interface EmailActivity {
  id: string;
  subject: string;
  from: string;
  readBy: string;
  timestamp: Date;
  action: EmailAction;
  status: EmailStatus;
  summary: string;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  type: "task_start" | "task_complete" | "handoff" | "email_read" | "message" | "error";
  description: string;
  timestamp: Date;
  metadata?: Record<string, string>;
}
