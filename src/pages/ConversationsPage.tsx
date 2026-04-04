import { messages, agents } from "@/data/mock-agents";
import { ConversationThread } from "@/components/dashboard/ConversationThread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function ConversationsPage() {
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filterAgent === "all") return messages;
    return messages.filter((m) => m.fromAgent === filterAgent || m.toAgent === filterAgent);
  }, [filterAgent]);

  // Group by task
  const grouped = useMemo(() => {
    const map = new Map<string, typeof messages>();
    filtered.forEach((m) => {
      const key = m.taskId || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Conversations</h2>
      <Select value={filterAgent} onValueChange={setFilterAgent}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter agent" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Agents</SelectItem>
          {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-4">
        {grouped.map(([taskId, msgs]) => (
          <Card key={taskId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">{taskId === "general" ? "General" : taskId}</CardTitle>
            </CardHeader>
            <CardContent><ConversationThread messages={msgs} /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
