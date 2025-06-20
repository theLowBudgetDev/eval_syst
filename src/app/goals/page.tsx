
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function GoalsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goal Setting & Tracking"
        description="Define, monitor, and achieve your personal and team objectives."
        actions={
          <Button onClick={() => router.push("/goals/new")} disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> New Goal (Coming Soon)
          </Button>
        }
      />
      <ComingSoon featureName="Goal Setting and Tracking" />
    </div>
  );
}
