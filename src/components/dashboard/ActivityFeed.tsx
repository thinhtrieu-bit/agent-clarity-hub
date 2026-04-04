import { ActivityEvent } from "@/types/agent-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

function tone(category: ActivityEvent["category"]) {
  if (category === "task") return "default";
  if (category === "email") return "secondary";
  return "outline";
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const sorted = [...events].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Live Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[360px] pr-4">
          <div className="space-y-3">
            {sorted.map((event) => (
              <div key={event.id} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant={tone(event.category)} className="capitalize">
                    {event.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{event.summary}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
