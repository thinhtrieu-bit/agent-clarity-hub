import AgentStatusCard from "@/components/dashboard/AgentStatusCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ConversationThread from "@/components/dashboard/ConversationThread";
import PipelineView from "@/components/dashboard/PipelineView";
import { DashboardSnapshot } from "@/api/agent-activity-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentActivity } from "@/context/AgentActivityProvider";

function metricCards(metrics: DashboardSnapshot["metrics"]) {
  return [
    { label: "Tasks Completed Today", value: metrics.tasksCompletedToday },
    { label: "Avg Pipeline Time (min)", value: metrics.avgPipelineTimeMinutes },
    { label: "Active Conversations", value: metrics.activeConversations },
    { label: "Emails Processed", value: metrics.emailsProcessed },
  ];
}

export default function Dashboard() {
  const { data, loading, error } = useAgentActivity();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading live dashboard data...</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load dashboard data: {error || "No data"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.agents.map((agent) => (
          <AgentStatusCard key={agent.id} agent={agent} tasks={data.tasks} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards(data.metrics).map((metric) => (
          <Card key={metric.label} className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PipelineView tasks={data.tasks} />
        </div>
        <div className="xl:col-span-2">
          <ActivityFeed events={data.events} />
        </div>
      </div>

      <ConversationThread messages={data.messages.slice(0, 16)} />
    </div>
  );
}
