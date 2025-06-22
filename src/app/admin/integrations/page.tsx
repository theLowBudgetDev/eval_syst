
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GitBranch, MessageSquare, Calendar } from "lucide-react";

const integrations = [
  {
    name: "Slack",
    description: "Send notifications for reviews, goals, and feedback directly to Slack channels.",
    icon: MessageSquare,
  },
  {
    name: "Google Calendar",
    description: "Sync evaluation deadlines and goal due dates with your team's Google Calendars.",
    icon: Calendar,
  },
  {
    name: "Jira / Linear",
    description: "Link employee goals to specific project tickets for better progress tracking.",
    icon: GitBranch,
  }
];


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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.name} className="shadow-md flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 text-primary p-3 rounded-full">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button disabled>Connect</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <div className="text-center mt-8">
          <p className="text-muted-foreground">More integrations are planned for the future. Check back soon!</p>
       </div>
    </div>
  );
}
