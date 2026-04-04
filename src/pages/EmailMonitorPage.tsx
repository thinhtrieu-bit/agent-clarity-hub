import { emails, getAgentById } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { EmailActivity } from "@/types/agent-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const statusBadge: Record<string, string> = {
  unread: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  read: "bg-muted text-muted-foreground",
  processed: "bg-green-500/15 text-green-700 border-green-500/30",
  flagged: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  ignored: "bg-muted text-muted-foreground opacity-60",
};

export default function EmailMonitorPage() {
  const [selected, setSelected] = useState<EmailActivity | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Email Monitor</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Read By</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((e) => {
            const agent = getAgentById(e.readBy);
            return (
              <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                <TableCell className="max-w-[250px] truncate">{e.subject}</TableCell>
                <TableCell className="text-xs">{e.from}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5"><AvatarFallback style={{ backgroundColor: agent?.avatarColor }} className="text-[9px] text-white">{agent?.name[0]}</AvatarFallback></Avatar>
                    <span className="text-sm">{agent?.name}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs">{e.action}</TableCell>
                <TableCell><Badge variant="outline" className={statusBadge[e.status]}>{e.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(e.timestamp, { addSuffix: true })}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.subject}</SheetTitle>
                <SheetDescription>From: {selected.from}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm">{selected.summary}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Read by: {getAgentById(selected.readBy)?.name}</p>
                  <p>Action: {selected.action}</p>
                  <p>Status: {selected.status}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
