import { Activity, Clock3 } from "lucide-react";
import { Agent, AgentTask } from "@/types/agent-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function statusTone(status: Agent["status"]) {
  if (status === "active") return "bg-emerald-500";
  if (status === "waiting") return "bg-amber-500";
  return "bg-slate-400";
}

export default function AgentStatusCard({ agent, tasks }: { agent: Agent; tasks: AgentTask[] }) {
  const task = tasks.find((entry) => entry.id === agent.currentTaskId);
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`h-10 w-10 ${agent.avatarColor}`}>
              <AvatarFallback className="bg-transparent font-semibold text-white">
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            <span className={`mr-2 inline-flex h-2 w-2 rounded-full ${statusTone(agent.status)}`} />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span className="truncate">{task ? task.title : "No active task"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          <span>Last active: {new Date(agent.lastActiveAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
