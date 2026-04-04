import { agents } from "@/data/mock-agents";
import { AgentTask } from "@/types/agent-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

const stageOrder = ["josh", "joey", "steve", "hulk"] as const;

interface Props { task: AgentTask; }

export function PipelineView({ task }: Props) {
  const currentIdx = task.stage === "completed" ? 4 : stageOrder.indexOf(task.stage as any);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {stageOrder.map((stage, i) => {
        const agent = agents.find((a) => a.id === stage)!;
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={stage} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isActive ? "border-primary bg-primary/10" : isDone ? "border-muted bg-muted/50" : "border-border bg-background opacity-50"
            }`}>
              <Avatar className="h-7 w-7">
                <AvatarFallback style={{ backgroundColor: agent.avatarColor, color: "white" }} className="text-xs">
                  {agent.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className={`text-sm ${isActive ? "font-semibold text-primary" : isDone ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
                {agent.name}
              </span>
              {isActive && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            </div>
            {i < stageOrder.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        );
      })}
      {task.stage === "completed" && (
        <>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-sm font-semibold text-green-700">
            ✓ Done
          </div>
        </>
      )}
    </div>
  );
}
