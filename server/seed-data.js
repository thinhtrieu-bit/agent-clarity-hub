export const STAGE_ORDER = ["josh", "joey", "steve", "hulk"];

export const AGENT_NAME_BY_ID = {
  josh: "Josh",
  joey: "Joey",
  steve: "Steve",
  hulk: "Hulk",
};

export const SEED_AGENTS = [
  {
    id: "josh",
    name: "Josh",
    role: "Intake + intent parsing",
    status: "active",
    avatarColor: "bg-sky-500",
    capabilities: ["Inbox triage", "Ticket creation", "Context extraction"],
    currentTaskId: "TASK-104",
    lastActiveAt: "2026-04-04T11:20:00.000Z",
  },
  {
    id: "joey",
    name: "Joey",
    role: "Research + dependency mapping",
    status: "waiting",
    avatarColor: "bg-emerald-500",
    capabilities: ["Knowledge retrieval", "Gap analysis", "Risk tagging"],
    currentTaskId: "TASK-102",
    lastActiveAt: "2026-04-04T11:17:00.000Z",
  },
  {
    id: "steve",
    name: "Steve",
    role: "Planner + spec authoring",
    status: "idle",
    avatarColor: "bg-amber-500",
    capabilities: ["Execution planning", "Spec drafting", "Acceptance criteria"],
    lastActiveAt: "2026-04-04T11:10:00.000Z",
  },
  {
    id: "hulk",
    name: "Hulk",
    role: "Executor + verifier",
    status: "active",
    avatarColor: "bg-rose-500",
    capabilities: ["Implementation", "Testing", "Deployment checks"],
    currentTaskId: "TASK-101",
    lastActiveAt: "2026-04-04T11:22:00.000Z",
  },
];

export const SEED_TASKS = [
  {
    id: "TASK-101",
    title: "Release readiness dashboard",
    description: "Build monitoring dashboard for daily standup.",
    stage: "hulk",
    assignedAgent: "hulk",
    status: "in_progress",
    createdAt: "2026-04-04T09:00:00.000Z",
    updatedAt: "2026-04-04T11:22:00.000Z",
    handoffs: [
      { from: "josh", to: "joey", at: "2026-04-04T09:12:00.000Z", note: "Requirements normalized." },
      { from: "joey", to: "steve", at: "2026-04-04T09:48:00.000Z", note: "Dependencies documented." },
      { from: "steve", to: "hulk", at: "2026-04-04T10:20:00.000Z", note: "Implementation plan approved." },
    ],
  },
  {
    id: "TASK-102",
    title: "Email response policy update",
    description: "Apply governance updates to outbound replies.",
    stage: "joey",
    assignedAgent: "joey",
    status: "in_progress",
    createdAt: "2026-04-04T09:30:00.000Z",
    updatedAt: "2026-04-04T11:17:00.000Z",
    handoffs: [{ from: "josh", to: "joey", at: "2026-04-04T09:40:00.000Z", note: "Intent and urgency classified." }],
  },
  {
    id: "TASK-103",
    title: "Incident postmortem summary",
    description: "Summarize root causes and action items.",
    stage: "steve",
    assignedAgent: "steve",
    status: "waiting",
    createdAt: "2026-04-04T10:15:00.000Z",
    updatedAt: "2026-04-04T10:58:00.000Z",
    handoffs: [
      { from: "josh", to: "joey", at: "2026-04-04T10:20:00.000Z", note: "Collected incident threads." },
      { from: "joey", to: "steve", at: "2026-04-04T10:58:00.000Z", note: "Sources aligned and deduped." },
    ],
  },
  {
    id: "TASK-104",
    title: "Customer escalation triage",
    description: "Triage urgent escalation and assign owners.",
    stage: "josh",
    assignedAgent: "josh",
    status: "queued",
    createdAt: "2026-04-04T11:16:00.000Z",
    updatedAt: "2026-04-04T11:20:00.000Z",
    handoffs: [],
  },
];

export const SEED_MESSAGES = [
  {
    id: "MSG-1",
    from: "josh",
    to: "joey",
    content: "Passing customer requirements pack for dependency scan.",
    taskId: "TASK-101",
    timestamp: "2026-04-04T09:12:00.000Z",
    type: "handoff",
  },
  {
    id: "MSG-2",
    from: "joey",
    to: "steve",
    content: "Found three external API dependencies and one risk.",
    taskId: "TASK-101",
    timestamp: "2026-04-04T09:48:00.000Z",
    type: "response",
  },
  {
    id: "MSG-3",
    from: "steve",
    to: "hulk",
    content: "Execution spec approved. Build dashboard with live feed first.",
    taskId: "TASK-101",
    timestamp: "2026-04-04T10:20:00.000Z",
    type: "handoff",
  },
];

export const SEED_EMAILS = [
  {
    id: "MAIL-1",
    subject: "Escalation: payment retries failing",
    from: "ops@northstar.io",
    readBy: "josh",
    timestamp: "2026-04-04T10:12:00.000Z",
    action: "Created TASK-104 and flagged urgent context.",
    status: "processed",
  },
  {
    id: "MAIL-2",
    subject: "Question about policy exception",
    from: "support@acme.com",
    readBy: "joey",
    timestamp: "2026-04-04T10:44:00.000Z",
    action: "Requested missing governance details from Josh.",
    status: "read",
  },
];

export const SEED_EVENTS = [
  {
    id: "EVT-1",
    timestamp: "2026-04-04T11:22:00.000Z",
    category: "task",
    summary: "Hulk started implementation for TASK-101.",
    entities: ["hulk", "TASK-101"],
  },
  {
    id: "EVT-2",
    timestamp: "2026-04-04T11:20:00.000Z",
    category: "agent",
    summary: "Josh switched to active on TASK-104.",
    entities: ["josh", "TASK-104"],
  },
];
