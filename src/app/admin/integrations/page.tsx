
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function IntegrationsManagementPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

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
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations Management"
        description="Connect EvalTrack with other services and platforms."
      />
      <ComingSoon featureName="Integrations Management" />
    </div>
  );
}
