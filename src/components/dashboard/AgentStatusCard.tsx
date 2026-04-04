import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Agent } from "@/types/agent-types";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/15 text-green-700 border-green-500/30" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
  waiting: { label: "Waiting", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  error: { label: "Error", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props { agent: Agent; onClick?: () => void; }

export function AgentStatusCard({ agent, onClick }: Props) {
  const cfg = statusConfig[agent.status];
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback style={{ backgroundColor: agent.avatarColor, color: "white" }}>
            {agent.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
        </div>
        <div className="relative">
          <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
          {agent.status === "active" && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tasks: {agent.tasksCompleted}</span>
          <span>{formatDistanceToNow(agent.lastActive, { addSuffix: true })}</span>
        </div>
        {agent.currentTask && (
          <p className="text-xs mt-1 font-mono text-primary">{agent.currentTask}</p>
        )}
      </CardContent>
    </Card>
  );
}
