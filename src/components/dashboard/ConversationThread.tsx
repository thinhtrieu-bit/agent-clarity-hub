import { AgentId, AgentMessage } from "@/types/agent-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const agentNames: Record<AgentId, string> = {
  josh: "Josh",
  joey: "Joey",
  steve: "Steve",
  hulk: "Hulk",
};

export default function ConversationThread({
  messages,
  taskId,
  pair,
}: {
  messages: AgentMessage[];
  taskId?: string;
  pair?: string;
}) {
  const filtered = messages
    .filter((message) => {
      const byTask = taskId ? message.taskId === taskId : true;
      const byPair = pair
        ? `${message.from}-${message.to}` === pair || `${message.to}-${message.from}` === pair
        : true;
      return byTask && byPair;
    })
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Conversation Thread</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[460px] pr-4">
          <div className="space-y-3">
            {filtered.map((message) => (
              <div key={message.id} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize">
                    {message.type}
                  </Badge>
                  <span>{agentNames[message.from]}</span>
                  <span>→</span>
                  <span>{agentNames[message.to]}</span>
                  <span>·</span>
                  <span>{message.taskId}</span>
                  <span>·</span>
                  <span>{new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            ))}
            {!filtered.length && <p className="text-sm text-muted-foreground">No messages match this filter.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
