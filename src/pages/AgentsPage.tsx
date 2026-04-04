import { agents, getTasksByAgent } from "@/data/mock-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Agent } from "@/types/agent-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function AgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Agents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(agent)}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback style={{ backgroundColor: agent.avatarColor, color: "white" }} className="text-lg">{agent.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.role}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-foreground">{selected.description}</p>
                <div>
                  <p className="text-sm font-medium mb-1">Tasks Completed: {selected.tasksCompleted}</p>
                  <p className="text-sm font-medium mb-2">Current Task: {selected.currentTask ?? "None"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Related Tasks</p>
                  <div className="space-y-2">
                    {getTasksByAgent(selected.id).map((t) => (
                      <div key={t.id} className="text-sm p-2 rounded border">
                        <span className="font-mono text-muted-foreground">{t.id}</span> — {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
