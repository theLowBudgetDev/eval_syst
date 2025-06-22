
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DataBackupPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = React.useState(false);

  React.useEffect(() => {
    if (!authIsLoading && user && user.role !== 'ADMIN') {
      router.push('/login');
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router]);

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

  if (authIsLoading || (!authIsLoading && user && user.role !== 'ADMIN')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Backup"
        description="Manage system data backups and exports."
      />

      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="h-6 w-6 text-primary"/>
            System Data Backup
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
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Previous Backups</h3>
            <p className="text-sm text-muted-foreground">
              A list of previous backups and their download links would appear here. This feature is not yet implemented.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
