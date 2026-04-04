import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAgentActivity } from "@/context/AgentActivityProvider";

export default function SettingsPage() {
  const { data, loading, error } = useAgentActivity();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [handoffAlerts, setHandoffAlerts] = useState(true);
  const [autoEscalation, setAutoEscalation] = useState(false);
  const [pipelineOrder, setPipelineOrder] = useState("Josh > Joey > Steve > Hulk");

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load settings data: {error || "No data"}</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{agent.name}</p>
                <Badge variant="outline">{agent.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Capabilities: {agent.capabilities.join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Pipeline Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input value={pipelineOrder} onChange={(e) => setPipelineOrder(e.target.value)} />
          <p className="text-sm text-muted-foreground">Change execution flow when orchestrator APIs are connected.</p>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <span>Email processing alerts</span>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </label>
          <label className="flex items-center justify-between">
            <span>Handoff transition alerts</span>
            <Switch checked={handoffAlerts} onCheckedChange={setHandoffAlerts} />
          </label>
          <label className="flex items-center justify-between">
            <span>Auto escalation on blocked tasks</span>
            <Switch checked={autoEscalation} onCheckedChange={setAutoEscalation} />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
