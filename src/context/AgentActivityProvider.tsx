import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createTask as apiCreateTask,
  DashboardSnapshot,
  getSnapshot,
  updateAgent as apiUpdateAgent,
  updateTask as apiUpdateTask,
} from "@/api/agent-activity-api";
import { Agent, AgentTask } from "@/types/agent-types";
import { supabase } from "@/integrations/supabase/client";

type AgentActivityContextValue = {
  data: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: { title: string; description?: string; assignedAgent?: string; status?: string }) => Promise<void>;
  updateTask: (taskId: string, input: Partial<AgentTask>) => Promise<void>;
  updateAgent: (agentId: string, input: Partial<Agent>) => Promise<void>;
};

const AgentActivityContext = createContext<AgentActivityContextValue | null>(null);

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingRefresh = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const snapshot = await getSnapshot();
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshot");
    } finally {
      setLoading(false);
    }
  }, []);

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
      return;
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
      createTask,
      updateTask,
      updateAgent,
    }),
    [createTask, data, error, loading, refresh, updateAgent, updateTask],
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
