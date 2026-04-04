import { AgentTask } from "@/types/agent-types";
import { getAgentById, getMessagesByTask } from "@/data/mock-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PipelineView } from "./PipelineView";
import { ConversationThread } from "./ConversationThread";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

const statusBadge: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  completed: "bg-green-500/15 text-green-700 border-green-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

interface Props { task: AgentTask; }

export function TaskDetail({ task }: Props) {
  const msgs = getMessagesByTask(task.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-sm text-muted-foreground">{task.id}</span>
        <Badge variant="outline" className={statusBadge[task.status]}>{task.status.replace("_", " ")}</Badge>
      </div>
      <h3 className="text-lg font-semibold">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.description}</p>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline Progress</CardTitle></CardHeader>
        <CardContent><PipelineView task={task} /></CardContent>
      </Card>

      {task.handoffs.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Handoff History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.handoffs.map((h, i) => {
                const from = getAgentById(h.fromAgent);
                const to = getAgentById(h.toAgent);
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Avatar className="h-6 w-6 shrink-0"><AvatarFallback style={{ backgroundColor: from?.avatarColor }} className="text-[10px] text-white">{from?.name[0]}</AvatarFallback></Avatar>
                    <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <Avatar className="h-6 w-6 shrink-0"><AvatarFallback style={{ backgroundColor: to?.avatarColor }} className="text-[10px] text-white">{to?.name[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="text-foreground">{h.notes}</p>
                      <p className="text-xs text-muted-foreground">{format(h.timestamp, "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {msgs.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Related Messages</CardTitle></CardHeader>
          <CardContent><ConversationThread messages={msgs} /></CardContent>
        </Card>
      )}
    </div>
  );
}
