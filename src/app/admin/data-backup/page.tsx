
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Download, Loader2, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import type { AuditLog } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/shared/DataTablePagination";

export default function DataBackupPage() {
  const { user, isLoading: authIsLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupHistory, setBackupHistory] = React.useState<AuditLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(5);

  const fetchHistory = React.useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setIsLoadingHistory(true);
    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);
      const res = await fetch("/api/admin/audit-logs?action=DATA_BACKUP_SUCCESS", { headers });
      if (!res.ok) throw new Error("Failed to fetch backup history");
      setBackupHistory(await res.json());
    } catch (error) {
      toast({ title: "Error Fetching History", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'ADMIN') {
        logout();
        router.push('/login');
      } else {
        fetchHistory();
      }
    }
  }, [user, authIsLoading, router, fetchHistory, logout]);

  const handleStartBackup = async () => {
    if (!user) return;
    setIsBackingUp(true);
    toast({
      title: "Starting Backup",
      description: "Preparing your data for download. This may take a moment...",
    });

    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      const res = await fetch("/api/admin/backup", { headers });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Failed to create data backup" }));
        throw new Error(errorBody.message);
      }
      
      const backupData = await res.json();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evaltrack_backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Successful",
        description: "Your data backup has been downloaded.",
      });
      fetchHistory(); // Refresh history after successful backup

    } catch (error) {
       toast({
        title: "Backup Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const paginatedHistory = backupHistory.slice((page - 1) * perPage, page * perPage);

  if (authIsLoading || isLoadingHistory) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return null; // Should be handled by AppContent redirect
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Backup"
        description="Manage system data backups and exports."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-6 w-6 text-primary"/>
              Create New Backup
            </CardTitle>
            <CardDescription>
              Create and download a JSON backup of your core application data. Regular backups are recommended.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Click the button below to generate a backup file containing users, goals, evaluations, and other key records.
            </p>
            <Button onClick={handleStartBackup} disabled={isBackingUp}>
              {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isBackingUp ? "Generating Backup..." : "Start New Backup"}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary"/>
              Backup History
            </CardTitle>
            <CardDescription>
              A log of successfully created data backups.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoadingHistory ? (
                <div className="space-y-2 p-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full"/>)}
                </div>
              ) : paginatedHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{format(parseISO(log.timestamp), "MMM d, yyyy, HH:mm")}</TableCell>
                        <TableCell>{log.user?.name || "Unknown Admin"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8 px-6">No backup history found.</p>
              )}
            </div>
          </CardContent>
          {backupHistory.length > perPage && (
            <CardFooter className="py-4 border-t">
              <DataTablePagination
                count={backupHistory.length}
                page={page}
                perPage={perPage}
                setPage={setPage}
                setPerPage={(value) => { setPerPage(value); setPage(1); }}
              />
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
