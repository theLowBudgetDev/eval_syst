
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function IntegrationsManagementPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
  
  const handleAddIntegration = () => {
     toast({
        title: "Feature Coming Soon",
        description: "Adding new integrations is not yet implemented.",
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations Management"
        description="Connect EvalTrack with other services and platforms."
        actions={
            <Button onClick={handleAddIntegration}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add New Integration
            </Button>
        }
      />

      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary"/>
            External Integrations
          </CardTitle>
          <CardDescription>
            Manage connections to third-party services like HRIS, communication tools, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will list available and configured integrations.
            Currently, this is a placeholder for the full integrations management functionality.
          </p>
          {/* Placeholder for list of integrations */}
          <div className="mt-6 border rounded-lg p-6 flex flex-col items-center justify-center h-48">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No integrations configured yet.</p>
            <Button variant="link" className="mt-2" onClick={handleAddIntegration}>Connect an integration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
