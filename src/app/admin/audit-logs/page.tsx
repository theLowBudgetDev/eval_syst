
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { AuditLog } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/shared/DataTablePagination";

export default function AuditLogsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const fetchData = React.useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setIsLoadingData(true);
    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      const res = await fetch("/api/admin/audit-logs", { headers });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Failed to fetch audit logs" }));
        throw new Error(errorBody.message);
      }
      setAuditLogs(await res.json());
    } catch (error) {
      toast({ title: "Error Fetching Audit Logs", description: (error as Error).message, variant: "destructive" });
      setAuditLogs([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'ADMIN') {
        router.push('/login');
      } else {
        fetchData();
      }
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, fetchData]);
  
  const paginatedLogs = auditLogs.slice((page - 1) * perPage, page * perPage);

  if (authIsLoading || (!isLoadingData && user?.role !== 'ADMIN')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Review system activity and important events."
        actions={
          <Button onClick={fetchData} disabled={isLoadingData} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        }
      />

      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/>System Event Log</CardTitle>
          <CardDescription>
            Shows recent actions performed within the system. (Currently displays latest 100 entries).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoadingData ? (
              <div className="p-6">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full my-1.5 rounded" />)}
              </div>
            ) : paginatedLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(parseISO(log.timestamp), "MMM d, yyyy, HH:mm:ss")}</TableCell>
                      <TableCell><Badge variant="secondary">{log.action.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell>{log.user?.name || (log.userId ? `User (${log.userId.substring(0,8)}...)` : "System")}</TableCell>
                      <TableCell>{log.targetType || "N/A"}</TableCell>
                      <TableCell className="truncate max-w-[100px]">{log.targetId || "N/A"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No audit logs found.</p>
              </div>
            )}
          </div>
        </CardContent>
        {auditLogs.length > perPage && (
          <CardFooter className="py-4 border-t">
            <DataTablePagination
              count={auditLogs.length}
              page={page}
              perPage={perPage}
              setPage={setPage}
              setPerPage={(value) => { setPerPage(value); setPage(1); }}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
