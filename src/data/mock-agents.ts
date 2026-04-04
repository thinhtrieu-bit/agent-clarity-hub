import {
  Agent, AgentTask, AgentMessage, EmailActivity, ActivityEvent,
} from "@/types/agent-types";

export const agents: Agent[] = [
  {
    id: "josh", name: "Josh", role: "Intake & Validation",
    description: "Checks basic completeness and linkability of incoming requests. First line of the JA flow.",
    status: "active", avatarColor: "hsl(210, 80%, 55%)",
    capabilities: ["Request validation", "Completeness checks", "Linkability verification", "Initial triage"],
    currentTask: "TASK-007", lastActive: new Date(), tasksCompleted: 142,
  },
  {
    id: "joey", name: "Joey", role: "Context Retrieval & Enrichment",
    description: "Retrieves workspace context and posts approved Jira enrichment comments.",
    status: "waiting", avatarColor: "hsl(150, 70%, 45%)",
    capabilities: ["Context retrieval", "Jira enrichment", "Workspace history", "Approved comments"],
    currentTask: "TASK-006", lastActive: new Date(Date.now() - 120000), tasksCompleted: 128,
  },
  {
    id: "steve", name: "Steve", role: "Noise Stripping & Normalization",
    description: "Strips noise and normalizes material for clean handoff to Hulk.",
    status: "idle", avatarColor: "hsl(35, 85%, 55%)",
    capabilities: ["Noise reduction", "Data normalization", "Summary generation", "Format standardization"],
    currentTask: null, lastActive: new Date(Date.now() - 300000), tasksCompleted: 135,
  },
  {
    id: "hulk", name: "Hulk", role: "Draft Generation",
    description: "Turns cleaned input into Jira-ready drafts or replies. Final stage of the JA flow.",
    status: "active", avatarColor: "hsl(280, 70%, 55%)",
    capabilities: ["Jira draft creation", "Reply generation", "Template application", "Final review"],
    currentTask: "TASK-005", lastActive: new Date(Date.now() - 60000), tasksCompleted: 119,
  },
];

export const tasks: AgentTask[] = [
  {
    id: "TASK-007", title: "Validate incoming support ticket #4821",
    description: "New support ticket needs completeness check before routing.",
    stage: "josh", assignedAgent: "josh", status: "in_progress",
    createdAt: new Date(Date.now() - 180000), updatedAt: new Date(),
    completedAt: null, handoffs: [],
  },
  {
    id: "TASK-006", title: "Enrich context for infrastructure request",
    description: "Retrieve workspace history and add Jira context for infra request.",
    stage: "joey", assignedAgent: "joey", status: "in_progress",
    createdAt: new Date(Date.now() - 600000), updatedAt: new Date(Date.now() - 120000),
    completedAt: null,
    handoffs: [
      { fromAgent: "josh", toAgent: "joey", timestamp: new Date(Date.now() - 300000), notes: "Validated. All fields present. Linked to PROJ-112." },
    ],
  },
  {
    id: "TASK-005", title: "Generate Jira draft for API migration",
    description: "Create Jira-ready draft from cleaned migration requirements.",
    stage: "hulk", assignedAgent: "hulk", status: "in_progress",
    createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(Date.now() - 60000),
    completedAt: null,
    handoffs: [
      { fromAgent: "josh", toAgent: "joey", timestamp: new Date(Date.now() - 3000000), notes: "Complete. Linked to PROJ-108." },
      { fromAgent: "joey", toAgent: "steve", timestamp: new Date(Date.now() - 2400000), notes: "Context enriched. 3 related tickets found." },
      { fromAgent: "steve", toAgent: "hulk", timestamp: new Date(Date.now() - 1200000), notes: "Normalized. Removed 40% noise. Clean summary attached." },
    ],
  },
  {
    id: "TASK-004", title: "Process onboarding checklist review",
    description: "Review and draft response for onboarding checklist submission.",
    stage: "completed", assignedAgent: "hulk", status: "completed",
    createdAt: new Date(Date.now() - 7200000), updatedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(Date.now() - 3600000),
    handoffs: [
      { fromAgent: "josh", toAgent: "joey", timestamp: new Date(Date.now() - 6600000), notes: "Valid request. All links working." },
      { fromAgent: "joey", toAgent: "steve", timestamp: new Date(Date.now() - 5400000), notes: "Enriched with onboarding template context." },
      { fromAgent: "steve", toAgent: "hulk", timestamp: new Date(Date.now() - 4800000), notes: "Clean. Ready for draft." },
    ],
  },
  {
    id: "TASK-003", title: "Handle urgent security patch notification",
    description: "Security patch notification needs immediate triage and Jira ticket.",
    stage: "completed", assignedAgent: "hulk", status: "completed",
    createdAt: new Date(Date.now() - 14400000), updatedAt: new Date(Date.now() - 10800000),
    completedAt: new Date(Date.now() - 10800000),
    handoffs: [
      { fromAgent: "josh", toAgent: "joey", timestamp: new Date(Date.now() - 14000000), notes: "URGENT. Security related. Fast-tracked." },
      { fromAgent: "joey", toAgent: "steve", timestamp: new Date(Date.now() - 13200000), notes: "CVE context added. 2 prior patches referenced." },
      { fromAgent: "steve", toAgent: "hulk", timestamp: new Date(Date.now() - 12000000), notes: "Stripped to essentials. Priority: Critical." },
    ],
  },
];

export const messages: AgentMessage[] = [
  { id: "MSG-001", fromAgent: "josh", toAgent: "joey", content: "Incoming ticket #4821 validated. All required fields present. Linked to existing project PROJ-112. Ready for context enrichment.", taskId: "TASK-006", timestamp: new Date(Date.now() - 300000), type: "handoff" },
  { id: "MSG-002", fromAgent: "joey", toAgent: "josh", content: "Acknowledged. Pulling workspace history for PROJ-112. Found 3 related tickets in the last 30 days.", taskId: "TASK-006", timestamp: new Date(Date.now() - 280000), type: "response" },
  { id: "MSG-003", fromAgent: "joey", toAgent: "steve", content: "Context enrichment complete for API migration task. Added Jira comments with related ticket links and workspace history summary.", taskId: "TASK-005", timestamp: new Date(Date.now() - 2400000), type: "handoff" },
  { id: "MSG-004", fromAgent: "steve", toAgent: "joey", content: "Received. Beginning noise reduction. Initial scan shows ~40% redundant content.", taskId: "TASK-005", timestamp: new Date(Date.now() - 2380000), type: "response" },
  { id: "MSG-005", fromAgent: "steve", toAgent: "hulk", content: "Normalization complete. Cleaned summary attached. Original 2400 words reduced to 890. All key requirements preserved.", taskId: "TASK-005", timestamp: new Date(Date.now() - 1200000), type: "handoff" },
  { id: "MSG-006", fromAgent: "hulk", toAgent: "steve", content: "Clean input received. Generating Jira draft using standard migration template. ETA: 3 minutes.", taskId: "TASK-005", timestamp: new Date(Date.now() - 1180000), type: "response" },
  { id: "MSG-007", fromAgent: "josh", toAgent: "system", content: "New request received. Running completeness validation on ticket #4821.", taskId: "TASK-007", timestamp: new Date(Date.now() - 180000), type: "system" },
  { id: "MSG-008", fromAgent: "hulk", toAgent: "josh", content: "Draft for TASK-004 (onboarding checklist) posted to Jira. Awaiting human review.", taskId: "TASK-004", timestamp: new Date(Date.now() - 3600000), type: "system" },
];

export const emails: EmailActivity[] = [
  { id: "EMAIL-001", subject: "Re: Infrastructure scaling request Q2", from: "ops-team@company.com", readBy: "joey", timestamp: new Date(Date.now() - 900000), action: "forwarded", status: "processed", summary: "Q2 scaling requirements with budget approval. Forwarded context to enrichment pipeline." },
  { id: "EMAIL-002", subject: "URGENT: CVE-2024-3094 patch required", from: "security@company.com", readBy: "josh", timestamp: new Date(Date.now() - 14400000), action: "escalated", status: "processed", summary: "Critical security patch notification. Escalated to fast-track pipeline." },
  { id: "EMAIL-003", subject: "Weekly standup notes - Sprint 42", from: "pm@company.com", readBy: "joey", timestamp: new Date(Date.now() - 28800000), action: "archived", status: "read", summary: "Sprint notes reviewed. No actionable items for current pipeline." },
  { id: "EMAIL-004", subject: "New team member onboarding checklist", from: "hr@company.com", readBy: "josh", timestamp: new Date(Date.now() - 43200000), action: "forwarded", status: "processed", summary: "Onboarding checklist for new hire. Created task TASK-004." },
  { id: "EMAIL-005", subject: "API deprecation notice - v2 endpoints", from: "platform@company.com", readBy: "joey", timestamp: new Date(Date.now() - 86400000), action: "escalated", status: "flagged", summary: "v2 API endpoints deprecated. Flagged for migration planning." },
  { id: "EMAIL-006", subject: "Meeting notes: Architecture review", from: "cto@company.com", readBy: "steve", timestamp: new Date(Date.now() - 172800000), action: "archived", status: "read", summary: "Architecture review notes. Archived for reference." },
];

export const activityFeed: ActivityEvent[] = [
  { id: "EVT-001", agentId: "josh", type: "task_start", description: "Started validating ticket #4821", timestamp: new Date(Date.now() - 180000) },
  { id: "EVT-002", agentId: "joey", type: "email_read", description: "Read email: Infrastructure scaling request Q2", timestamp: new Date(Date.now() - 900000) },
  { id: "EVT-003", agentId: "josh", type: "handoff", description: "Handed off TASK-006 to Joey", timestamp: new Date(Date.now() - 300000) },
  { id: "EVT-004", agentId: "joey", type: "message", description: "Posted enrichment comment on PROJ-112", timestamp: new Date(Date.now() - 280000) },
  { id: "EVT-005", agentId: "steve", type: "task_complete", description: "Completed normalization for TASK-005", timestamp: new Date(Date.now() - 1200000) },
  { id: "EVT-006", agentId: "hulk", type: "task_start", description: "Started generating Jira draft for TASK-005", timestamp: new Date(Date.now() - 1180000) },
  { id: "EVT-007", agentId: "hulk", type: "task_complete", description: "Posted Jira draft for TASK-004", timestamp: new Date(Date.now() - 3600000) },
  { id: "EVT-008", agentId: "josh", type: "email_read", description: "Read email: URGENT CVE-2024-3094 patch", timestamp: new Date(Date.now() - 14400000) },
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getTasksByAgent(agentId: string): AgentTask[] {
  return tasks.filter((t) => t.assignedAgent === agentId || t.handoffs.some((h) => h.fromAgent === agentId || h.toAgent === agentId));
}

export function getMessagesByTask(taskId: string): AgentMessage[] {
  return messages.filter((m) => m.taskId === taskId);
}

export function getConversationBetween(agent1: string, agent2: string): AgentMessage[] {
  return messages.filter(
    (m) => (m.fromAgent === agent1 && m.toAgent === agent2) || (m.fromAgent === agent2 && m.toAgent === agent1)
  );
}
