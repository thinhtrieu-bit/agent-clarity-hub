import { AgentMessage } from "@/types/agent-types";
import { getAgentById } from "@/data/mock-agents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const typeBadge: Record<string, string> = {
  handoff: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  query: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  response: "bg-green-500/15 text-green-700 border-green-500/30",
  system: "bg-muted text-muted-foreground",
};

interface Props { messages: AgentMessage[]; }

export function ConversationThread({ messages }: Props) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const from = getAgentById(msg.fromAgent);
        const to = getAgentById(msg.toAgent);
        return (
          <div key={msg.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback style={{ backgroundColor: from?.avatarColor }} className="text-xs text-white">
                {from?.name[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{from?.name ?? msg.fromAgent}</span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="text-sm text-muted-foreground">{to?.name ?? msg.toAgent}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadge[msg.type] ?? ""}`}>{msg.type}</Badge>
                {msg.taskId && <span className="text-[10px] font-mono text-muted-foreground">{msg.taskId}</span>}
              </div>
              <p className="text-sm text-foreground">{msg.content}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(msg.timestamp, { addSuffix: true })}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
