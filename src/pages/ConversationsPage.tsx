import { useState } from "react";
import ConversationThread from "@/components/dashboard/ConversationThread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentActivity } from "@/context/AgentActivityProvider";

const pairOptions = [
  { value: "all", label: "All pairs" },
  { value: "josh-joey", label: "Josh ↔ Joey" },
  { value: "joey-steve", label: "Joey ↔ Steve" },
  { value: "steve-hulk", label: "Steve ↔ Hulk" },
  { value: "josh-hulk", label: "Josh ↔ Hulk" },
];

export default function ConversationsPage() {
  const { data, loading, error } = useAgentActivity();
  const [pair, setPair] = useState("all");
  const [taskId, setTaskId] = useState("all");

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
