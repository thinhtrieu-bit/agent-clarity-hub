import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createTask as apiCreateTask,
  DashboardSnapshot,
  getSnapshot,
  syncActivity as apiSyncActivity,
  updateAgent as apiUpdateAgent,
  updateTask as apiUpdateTask,
} from "@/api/agent-activity-api";
import { Agent, AgentMessage, AgentTask, EmailActivity, ActivityEvent } from "@/types/agent-types";
import { supabase } from "@/lib/supabase";

type AgentActivityContextValue = {
  data: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  createTask: (input: { title: string; description?: string; assignedAgent?: string; status?: string }) => Promise<void>;
  updateTask: (taskId: string, input: Partial<AgentTask>) => Promise<void>;
  updateAgent: (agentId: string, input: Partial<Agent>) => Promise<void>;
};

const AgentActivityContext = createContext<AgentActivityContextValue | null>(null);

function buildMetrics(tasks: AgentTask[], messages: AgentMessage[], emails: EmailActivity[]) {
  const completedToday = tasks.filter((task) => Boolean(task.completedAt)).length;
  const durations = tasks
    .filter((task) => task.completedAt)
    .map((task) => (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60));
  const avgPipelineTimeMinutes = durations.length
    ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
    : 0;
  const activeConversations = new Set(messages.map((message) => `${message.from}-${message.to}-${message.taskId}`)).size;
  const emailsProcessed = emails.filter((email) => email.status === "processed").length;

  return {
    tasksCompletedToday: completedToday,
    avgPipelineTimeMinutes,
    activeConversations,
    emailsProcessed,
  };
}

async function readTablePayload<T>(table: string): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select("payload_json, updated_at").order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map((row) => row.payload_json as T);
}

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingRefresh = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (supabase) {
        const [agents, tasks, messages, emails, events] = await Promise.all([
          readTablePayload<Agent>("agents"),
          readTablePayload<AgentTask>("tasks"),
          readTablePayload<AgentMessage>("messages"),
          readTablePayload<EmailActivity>("emails"),
          readTablePayload<ActivityEvent>("events"),
        ]);
        setData({
          agents,
          tasks,
          messages,
          emails,
          events,
          metrics: buildMetrics(tasks, messages, emails),
          syncedAt: new Date().toISOString(),
        });
      } else {
        // Fallback keeps the app usable when Supabase env vars are not configured.
        const snapshot = await getSnapshot();
        setData(snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshot");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    try {
      setError(null);
      await apiSyncActivity();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync activity");
    }
  }, [refresh]);

  const createTask = useCallback(async (input: { title: string; description?: string; assignedAgent?: string; status?: string }) => {
    await apiCreateTask(input);
    await refresh();
  }, [refresh]);

  const updateTask = useCallback(async (taskId: string, input: Partial<AgentTask>) => {
    await apiUpdateTask(taskId, input);
    await refresh();
  }, [refresh]);

  const updateAgent = useCallback(async (agentId: string, input: Partial<Agent>) => {
    await apiUpdateAgent(agentId, input);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();

    if (!supabase) {
      const interval = window.setInterval(() => {
        void apiSyncActivity().then(refresh).catch(() => {});
      }, 6000);
      return () => {
        window.clearInterval(interval);
      };
    }

    const scheduleRefresh = () => {
      if (pendingRefresh.current) {
        window.clearTimeout(pendingRefresh.current);
      }
      pendingRefresh.current = window.setTimeout(() => {
        void refresh();
      }, 250);
    };

    const channel = supabase
      .channel("dashboard-activity-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "emails" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleRefresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pendingRefresh.current) {
        window.clearTimeout(pendingRefresh.current);
      }
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      syncNow,
      createTask,
      updateTask,
      updateAgent,
    }),
    [createTask, data, error, loading, refresh, syncNow, updateAgent, updateTask],
  );

  return <AgentActivityContext.Provider value={value}>{children}</AgentActivityContext.Provider>;
}

export function useAgentActivity() {
  const context = useContext(AgentActivityContext);
  if (!context) {
    throw new Error("useAgentActivity must be used within AgentActivityProvider");
  }
  return context;
}
