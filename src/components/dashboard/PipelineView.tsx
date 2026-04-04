import { ArrowRight } from "lucide-react";
import { AgentTask, TaskStage } from "@/types/agent-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const stageLabels: { id: TaskStage; label: string }[] = [
  { id: "josh", label: "Josh" },
  { id: "joey", label: "Joey" },
  { id: "steve", label: "Steve" },
  { id: "hulk", label: "Hulk" },
];

export default function PipelineView({ tasks }: { tasks: AgentTask[] }) {
  const focusedTask = tasks.find((task) => task.status === "in_progress") ?? tasks[0];
  const activeIndex = stageLabels.findIndex((stage) => stage.id === focusedTask?.stage);
  const progress = focusedTask ? ((activeIndex + 1) / stageLabels.length) * 100 : 0;

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Pipeline Visualization</CardTitle>
        <p className="text-sm text-muted-foreground">
          {focusedTask ? `${focusedTask.id} · ${focusedTask.title}` : "No task currently in the pipeline"}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={progress} className="h-2" />
        <div className="grid gap-3 md:grid-cols-4">
          {stageLabels.map((stage, index) => {
            const isActive = activeIndex === index;
            const isDone = activeIndex > index;
            return (
              <div key={stage.id} className="flex items-center gap-2">
                <div
                  className={[
                    "min-w-0 flex-1 rounded-lg border p-3 text-sm",
                    isActive && "border-primary bg-primary/10",
                    isDone && "border-emerald-500/60 bg-emerald-500/10",
                    !isActive && !isDone && "border-border bg-muted/30",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p className="font-medium">{stage.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isActive ? "Current stage" : isDone ? "Completed" : "Pending"}
                  </p>
                </div>
                {index < stageLabels.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
