import { agents, tasks, activityFeed } from "@/data/mock-agents";
import { AgentStatusCard } from "@/components/dashboard/AgentStatusCard";
import { PipelineView } from "@/components/dashboard/PipelineView";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ListTodo, MessageSquare, Mail, Clock } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const activeTasks = tasks.filter((t) => t.status === "in_progress");
  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const emailsProcessed = 6;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Real-time agent monitoring — JA Flow: Josh → Joey → Steve → Hulk</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Tasks", value: activeTasks.length, icon: ListTodo },
          { label: "Completed", value: completedToday, icon: Clock },
          { label: "Conversations", value: 8, icon: MessageSquare },
          { label: "Emails Processed", value: emailsProcessed, icon: Mail },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10"><m.icon className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold text-foreground">{m.value}</p><p className="text-xs text-muted-foreground">{m.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Status Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Agent Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} onClick={() => navigate("/agents")} />
          ))}
        </div>
      </div>

      {/* Pipeline + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Active Pipelines</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeTasks.map((t) => (
              <div key={t.id}>
                <p className="text-sm font-medium mb-1">{t.id}: {t.title}</p>
                <PipelineView task={t} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Feed</CardTitle></CardHeader>
          <CardContent><ActivityFeed /></CardContent>
        </Card>
      </div>
    </div>
  );
}
