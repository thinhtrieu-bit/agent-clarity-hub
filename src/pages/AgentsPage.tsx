import { useState } from "react";
import AgentStatusCard from "@/components/dashboard/AgentStatusCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentActivity } from "@/context/AgentActivityProvider";

export default function AgentsPage() {
  const { data, loading, error } = useAgentActivity();
  const [selectedId, setSelectedId] = useState("josh");

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading agents...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load agents: {error || "No data"}</p>;
  }

  const selected = data.agents.find((agent) => agent.id === selectedId) ?? data.agents[0];
  const agentTasks = data.tasks.filter((task) => task.assignedAgent === selected?.id);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        <h2 className="text-lg font-semibold">Agents</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.agents.map((agent) => (
            <button key={agent.id} onClick={() => setSelectedId(agent.id)} className="text-left">
              <div className={selectedId === agent.id ? "ring-2 ring-primary ring-offset-2" : ""}>
                <AgentStatusCard agent={agent} tasks={data.tasks} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="border-border/70 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Agent Detail Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {selected ? (
            <>
              <div>
                <p className="text-lg font-semibold">{selected.name}</p>
                <p className="text-muted-foreground">{selected.role}</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {selected.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Current State</p>
                <p className="capitalize text-muted-foreground">{selected.status}</p>
                <p className="text-muted-foreground">
                  Last active {new Date(selected.lastActiveAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Assigned Tasks</p>
                {agentTasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-border/60 p-2">
                    <p className="font-medium">
                      {task.id} · {task.title}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">{task.status.replace("_", " ")}</p>
                  </div>
                ))}
                {!agentTasks.length && <p className="text-muted-foreground">No tasks currently assigned.</p>}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No agent selected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
