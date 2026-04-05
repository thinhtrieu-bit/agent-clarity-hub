import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
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

  const refresh = async () => {
    try {
      setError(null);
      const snapshot = await getSnapshot();
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshot");
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (input: { title: string; description?: string; assignedAgent?: string; status?: string }) => {
    await apiCreateTask(input);
    await refresh();
  };

  const updateTask = async (taskId: string, input: Partial<AgentTask>) => {
    await apiUpdateTask(taskId, input);
    await refresh();
  };

  const updateAgent = async (agentId: string, input: Partial<Agent>) => {
    await apiUpdateAgent(agentId, input);
    await refresh();
  };

  useEffect(() => {
    void refresh();

    // Subscribe to realtime changes on all 5 tables
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "emails" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => void refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    [data, loading, error],
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
