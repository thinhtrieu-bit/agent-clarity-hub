import { agents } from "@/data/mock-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Pipeline Order</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            {agents.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border">
                  <Avatar className="h-7 w-7"><AvatarFallback style={{ backgroundColor: a.avatarColor, color: "white" }} className="text-xs">{a.name[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{a.name}</span>
                </div>
                {i < agents.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Agent Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {agents.map((a) => (
            <div key={a.id}>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8"><AvatarFallback style={{ backgroundColor: a.avatarColor, color: "white" }}>{a.name[0]}</AvatarFallback></Avatar>
                <div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.role}</p></div>
              </div>
              <div className="flex flex-wrap gap-1.5 ml-11">
                {a.capabilities.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Governance Rules</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Agents do not invent approvals or skip role boundaries</p>
          <p>• Jira comments only posted through the approved path (Joey)</p>
          <p>• Email access requires explicit user permission per integration</p>
          <p>• All handoffs include context notes and timestamps</p>
          <p>• Pipeline order cannot be modified during active tasks</p>
        </CardContent>
      </Card>
    </div>
  );
}
