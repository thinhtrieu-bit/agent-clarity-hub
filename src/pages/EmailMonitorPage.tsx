import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgentActivity } from "@/context/AgentActivityProvider";
import { EmailActivity } from "@/types/agent-types";

function badgeTone(status: EmailActivity["status"]) {
  if (status === "processed") return "default";
  if (status === "flagged") return "destructive";
  return "secondary";
}

export default function EmailMonitorPage() {
  const { data, loading, error } = useAgentActivity();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading email activity...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Unable to load email monitor: {error || "No data"}</p>;
  }

  const sorted = [...data.emails].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Email Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Read By</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">{email.subject}</TableCell>
                  <TableCell>{email.from}</TableCell>
                  <TableCell className="uppercase">{email.readBy}</TableCell>
                  <TableCell>{new Date(email.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{email.action}</TableCell>
                  <TableCell>
                    <Badge variant={badgeTone(email.status)} className="capitalize">
                      {email.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
