import { useState } from "react";
import TaskDetail from "@/components/dashboard/TaskDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgentActivity } from "@/context/AgentActivityProvider";

export default function TasksPage() {
  const { data, loading, error, createTask, updateTask } = useAgentActivity();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading tasks...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load tasks: {error || "No data"}</p>;
  }

  const filtered = data.tasks.filter((task) => {
    const byAgent = agentFilter === "all" ? true : task.assignedAgent === agentFilter;
    const byStatus = statusFilter === "all" ? true : task.status === statusFilter;
    const byQuery =
      query.trim().length === 0 ||
      task.id.toLowerCase().includes(query.toLowerCase()) ||
      task.title.toLowerCase().includes(query.toLowerCase());
    return byAgent && byStatus && byQuery;
  });

  const selected = data.tasks.find((task) => task.id === selectedTaskId);

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Task Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-5">
            <Input
              placeholder="New task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="md:col-span-2"
            />
            <Input
              placeholder="Description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="md:col-span-2"
            />
            <Button
              onClick={async () => {
                if (!newTaskTitle.trim()) return;
                await createTask({ title: newTaskTitle.trim(), description: newTaskDescription.trim(), assignedAgent: "josh" });
                setNewTaskTitle("");
                setNewTaskDescription("");
              }}
            >
              Create Task
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Search task ID or title" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="rounded-md border bg-background px-3 text-sm" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
              <option value="all">All agents</option>
              <option value="josh">Josh</option>
              <option value="joey">Joey</option>
              <option value="steve">Steve</option>
              <option value="hulk">Hulk</option>
            </select>
            <select className="rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="queued">Queued</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{filtered.length} tasks shown</span>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedTaskId(task.id)}
                    data-state={task.id === selectedTaskId ? "selected" : undefined}
                  >
                    <TableCell className="font-medium">{task.id}</TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell className="uppercase">{task.stage}</TableCell>
                    <TableCell className="uppercase">{task.assignedAgent}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(task.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell>{new Date(task.updatedAt).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async (event) => {
                          event.stopPropagation();
                          const nextStatus = task.status === "completed" ? "in_progress" : "completed";
                          await updateTask(task.id, { status: nextStatus });
                        }}
                      >
                        Toggle Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <TaskDetail task={selected} />
    </div>
  );
}
