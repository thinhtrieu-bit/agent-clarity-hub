import { CalendarClock, CheckCircle2, CircleDashed, Link2 } from "lucide-react";
import { AgentTask } from "@/types/agent-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaskDetail({ task }: { task?: AgentTask }) {
  if (!task) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Task Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a task to inspect its full journey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {task.id} · {task.title}
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {task.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">{task.description}</p>
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDashed className="h-4 w-4 text-muted-foreground" />
            <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
          </div>
          {task.completedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Handoff Timeline</h3>
          <div className="space-y-2">
            {task.handoffs.map((handoff, index) => (
              <div key={`${handoff.at}-${index}`} className="rounded-md border border-border/60 p-2">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="uppercase">{handoff.from}</span>
                  <span>→</span>
                  <span className="uppercase">{handoff.to}</span>
                  <span>·</span>
                  <span>{new Date(handoff.at).toLocaleString()}</span>
                </div>
                <p>{handoff.note}</p>
              </div>
            ))}
            {!task.handoffs.length && <p className="text-muted-foreground">No handoffs yet.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
