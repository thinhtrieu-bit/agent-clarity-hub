import { tasks, agents } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AgentTask } from "@/types/agent-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskDetail } from "@/components/dashboard/TaskDetail";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

const statusBadge: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  completed: "bg-green-500/15 text-green-700 border-green-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function TasksPage() {
  const [selected, setSelected] = useState<AgentTask | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = tasks.filter((t) => {
    if (filterAgent !== "all" && t.assignedAgent !== filterAgent) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
      <div className="flex gap-3">
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
              <TableCell className="font-mono text-xs">{t.id}</TableCell>
              <TableCell>{t.title}</TableCell>
              <TableCell className="capitalize">{t.stage}</TableCell>
              <TableCell><Badge variant="outline" className={statusBadge[t.status]}>{t.status.replace("_"," ")}</Badge></TableCell>
              <TableCell className="text-muted-foreground text-xs">{formatDistanceToNow(t.updatedAt, { addSuffix: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
            <SheetDescription>Full pipeline journey</SheetDescription>
          </SheetHeader>
          {selected && <div className="mt-4"><TaskDetail task={selected} /></div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
