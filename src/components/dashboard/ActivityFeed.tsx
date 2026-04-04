import { activityFeed, getAgentById } from "@/data/mock-agents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightLeft, CheckCircle2, Mail, MessageSquare, PlayCircle, AlertCircle } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  task_start: PlayCircle, task_complete: CheckCircle2,
  handoff: ArrowRightLeft, email_read: Mail,
  message: MessageSquare, error: AlertCircle,
};

export function ActivityFeed() {
  return (
    <ScrollArea className="h-[340px]">
      <div className="space-y-3 pr-3">
        {activityFeed.map((event) => {
          const agent = getAgentById(event.agentId);
          const Icon = iconMap[event.type] || MessageSquare;
          return (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                <AvatarFallback style={{ backgroundColor: agent?.avatarColor }} className="text-xs text-white">
                  {agent?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(event.timestamp, { addSuffix: true })}</p>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
