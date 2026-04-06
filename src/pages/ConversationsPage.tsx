import { useMemo, useState } from "react";
import ConversationThread from "@/components/dashboard/ConversationThread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentActivity } from "@/context/AgentActivityProvider";

function formatAgentName(id: string) {
  return id
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ConversationsPage() {
  const { data, loading, error } = useAgentActivity();
  const [pair, setPair] = useState("all");
  const [taskId, setTaskId] = useState("all");
  const pairOptions = useMemo(() => {
    const pairs = Array.from(new Set((data?.messages ?? []).map((message) => `${message.from}-${message.to}`)));
    return [
      { value: "all", label: "All pairs" },
      ...pairs.map((pairValue) => {
        const [from, to] = pairValue.split("-");
        return {
          value: pairValue,
          label: `${formatAgentName(from)} ↔ ${formatAgentName(to)}`,
        };
      }),
    ];
  }, [data?.messages]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading conversations...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load conversations: {error || "No data"}</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Inter-agent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <select className="rounded-md border bg-background px-3 text-sm" value={pair} onChange={(e) => setPair(e.target.value)}>
              {pairOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select className="rounded-md border bg-background px-3 text-sm" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="all">All tasks</option>
              {data.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.id}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <ConversationThread
        messages={data.messages}
        pair={pair === "all" ? undefined : pair}
        taskId={taskId === "all" ? undefined : taskId}
      />
    </div>
  );
}
