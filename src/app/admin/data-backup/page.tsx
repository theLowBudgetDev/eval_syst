
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

  if (authIsLoading || (!authIsLoading && user && user.role !== 'ADMIN')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const handleStartBackup = () => {
    setIsBackingUp(true);
    // Placeholder: In a real app, this would trigger an API call.
    setTimeout(() => {
      toast({
        title: "Backup Simulation",
        description: "Data backup process simulated. In a real app, a download would start or a file would be generated.",
      });
      setIsBackingUp(false);
    }, 2000);
  };

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
            Create backups of your application data. Regular backups are recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This section will allow administrators to initiate data backups.
            Currently, this is a placeholder for the full backup functionality.
          </p>
          <Button onClick={handleStartBackup} disabled={isBackingUp}>
            <Download className="mr-2 h-4 w-4" />
            {isBackingUp ? "Backing up..." : "Start New Backup (Simulated)"}
          </Button>
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Previous Backups</h3>
            <p className="text-sm text-muted-foreground">
              A list of previous backups and their download links would appear here.
            </p>
            {/* Placeholder for table or list of backups */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
