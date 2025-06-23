
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GitBranch, MessageSquare, Calendar } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";


export default function IntegrationsManagementPage() {
  const { user, isLoading: authIsLoading, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authIsLoading && user && user.role !== 'ADMIN') {
      logout();
      router.push('/login');
    }
  }, [user, authIsLoading, router, logout]);

  if (authIsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return null; // Should be handled by AppContent redirect
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations Management"
        description="Connect EvalTrack with other services and platforms."
      />
      <ComingSoon featureName="Integrations" />
    </div>
  );
}
