import { useEffect, useState } from "react";
import {
  ActivityEvent,
  Agent,
  AgentId,
  AgentMessage,
  AgentTask,
  DashboardMetrics,
  EmailActivity,
  TaskStage,
} from "@/types/agent-types";

const stageOrder: TaskStage[] = ["josh", "joey", "steve", "hulk"];

const agentNameById: Record<AgentId, string> = {
  josh: "Josh",
  joey: "Joey",
  steve: "Steve",
  hulk: "Hulk",
};

const agentsSeed: Agent[] = [
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

const tasksSeed: AgentTask[] = [
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
  {
    id: "TASK-090",
    title: "Weekly agent health report",
    description: "Aggregate performance and reliability trends.",
    stage: "hulk",
    assignedAgent: "hulk",
    status: "completed",
    createdAt: "2026-04-04T06:30:00.000Z",
    updatedAt: "2026-04-04T08:10:00.000Z",
    completedAt: "2026-04-04T08:10:00.000Z",
    handoffs: [
      { from: "josh", to: "joey", at: "2026-04-04T06:42:00.000Z", note: "Input metrics gathered." },
      { from: "joey", to: "steve", at: "2026-04-04T07:10:00.000Z", note: "Findings grouped by owner." },
      { from: "steve", to: "hulk", at: "2026-04-04T07:38:00.000Z", note: "Report template finalized." },
    ],
  },
];

const messagesSeed: AgentMessage[] = [
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
  {
    id: "MSG-4",
    from: "joey",
    to: "josh",
    content: "Need clarification on escalation SLA for enterprise tier.",
    taskId: "TASK-102",
    timestamp: "2026-04-04T10:55:00.000Z",
    type: "query",
  },
  {
    id: "MSG-5",
    from: "josh",
    to: "joey",
    content: "Use 2-hour response SLA and mark legal hold as blocking.",
    taskId: "TASK-102",
    timestamp: "2026-04-04T11:01:00.000Z",
    type: "response",
  },
];

const emailsSeed: EmailActivity[] = [
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
  {
    id: "MAIL-3",
    subject: "Security review required",
    from: "audit@contoso.net",
    readBy: "steve",
    timestamp: "2026-04-04T11:02:00.000Z",
    action: "Flagged for governance review before execution.",
    status: "flagged",
  },
  {
    id: "MAIL-4",
    subject: "FYI: marketing newsletter",
    from: "news@vendor.io",
    readBy: "hulk",
    timestamp: "2026-04-04T11:09:00.000Z",
    action: "Classified as non-actionable.",
    status: "ignored",
  },
];

const eventsSeed: ActivityEvent[] = [
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
  {
    id: "EVT-3",
    timestamp: "2026-04-04T11:17:00.000Z",
    category: "task",
    summary: "TASK-102 moved to Joey for dependency review.",
    entities: ["joey", "TASK-102"],
  },
  {
    id: "EVT-4",
    timestamp: "2026-04-04T11:12:00.000Z",
    category: "email",
    summary: "Josh processed escalation email from ops@northstar.io.",
    entities: ["josh", "MAIL-1"],
  },
];

export function getDashboardMetrics(tasks: AgentTask[], messages: AgentMessage[], emails: EmailActivity[]): DashboardMetrics {
  const completedToday = tasks.filter((task) => Boolean(task.completedAt)).length;
  const durations = tasks
    .filter((task) => task.completedAt)
    .map((task) => (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60));
  const avgPipelineTimeMinutes = durations.length
    ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
    : 0;
  const conversationPairs = new Set(messages.map((message) => `${message.from}-${message.to}-${message.taskId}`));
  const emailsProcessed = emails.filter((email) => email.status === "processed").length;

  return {
    tasksCompletedToday: completedToday,
    avgPipelineTimeMinutes,
    activeConversations: conversationPairs.size,
    emailsProcessed,
  };
}

export function useMockDashboardData() {
  const [agents, setAgents] = useState<Agent[]>(agentsSeed);
  const [tasks, setTasks] = useState<AgentTask[]>(tasksSeed);
  const [messages, setMessages] = useState<AgentMessage[]>(messagesSeed);
  const [emails, setEmails] = useState<EmailActivity[]>(emailsSeed);
  const [events, setEvents] = useState<ActivityEvent[]>(eventsSeed);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const ts = new Date().toISOString();
      const randomAgentId = stageOrder[Math.floor(Math.random() * stageOrder.length)];

      setAgents((current) =>
        current.map((agent) => {
          if (agent.id === randomAgentId) {
            return { ...agent, status: "active", lastActiveAt: ts };
          }
          return {
            ...agent,
            status: agent.status === "active" ? "waiting" : agent.status,
          };
        }),
      );

      setEvents((current) => [
        {
          id: `EVT-live-${Date.now()}`,
          timestamp: ts,
          category: "agent" as const,
          summary: `${agentNameById[randomAgentId]} heartbeat acknowledged by orchestrator.`,
          entities: [randomAgentId] as string[],
        },
        ...current,
      ].slice(0, 30));

      setTasks((current) => {
        const taskIndex = current.findIndex((task) => task.status === "in_progress" || task.status === "queued");
        if (taskIndex < 0) {
          return current;
        }

        const target = current[taskIndex];
        const stageIndex = stageOrder.indexOf(target.stage);
        if (stageIndex === stageOrder.length - 1) {
          const doneTask: AgentTask = {
            ...target,
            status: "completed",
            completedAt: ts,
            updatedAt: ts,
          };
          const next = [...current];
          next[taskIndex] = doneTask;

          setEvents((evtCurrent) => [
            {
              id: `EVT-task-done-${Date.now()}`,
              timestamp: ts,
              category: "task",
              summary: `${doneTask.id} completed by Hulk.`,
              entities: [doneTask.id, "hulk"],
            },
            ...evtCurrent,
          ].slice(0, 30));
          return next;
        }

        const nextStage = stageOrder[stageIndex + 1];
        const updatedTask: AgentTask = {
          ...target,
          stage: nextStage,
          assignedAgent: nextStage,
          status: "in_progress",
          updatedAt: ts,
          handoffs: [
            ...target.handoffs,
            {
              from: target.assignedAgent,
              to: nextStage,
              at: ts,
              note: `Auto-handoff from ${agentNameById[target.assignedAgent]} to ${agentNameById[nextStage]}.`,
            },
          ],
        };

        setMessages((messageCurrent) => [
          {
            id: `MSG-live-${Date.now()}`,
            from: target.assignedAgent,
            to: nextStage,
            content: `Task ${target.id} handed off with updated context.`,
            taskId: target.id,
            timestamp: ts,
            type: "handoff",
          },
          ...messageCurrent,
        ].slice(0, 80));

        setEvents((evtCurrent) => [
          {
            id: `EVT-task-${Date.now()}`,
            timestamp: ts,
            category: "task",
            summary: `${target.id} moved from ${agentNameById[target.assignedAgent]} to ${agentNameById[nextStage]}.`,
            entities: [target.id, target.assignedAgent, nextStage],
          },
          ...evtCurrent,
        ].slice(0, 30));

        const next = [...current];
        next[taskIndex] = updatedTask;
        return next;
      });

      if (Math.random() > 0.6) {
        const mailAgent = stageOrder[Math.floor(Math.random() * stageOrder.length)];
        setEmails((current) => [
          {
            id: `MAIL-live-${Date.now()}`,
            subject: `Automation digest ${new Date(ts).toLocaleTimeString()}`,
            from: "automation@system.local",
            readBy: mailAgent,
            timestamp: ts,
            action: "Parsed and routed to active pipeline.",
            status: "read",
          },
          ...current,
        ].slice(0, 40));
      }
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return {
    agents,
    tasks,
    messages,
    emails,
    events,
    metrics: getDashboardMetrics(tasks, messages, emails),
  };
}
