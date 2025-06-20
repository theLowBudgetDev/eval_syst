
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, MessageSquareWarning, CheckCircle2 } from "lucide-react";
import { mockEmployees, mockPerformanceScores } from "@/lib/mockData"; // Assuming you have mock data

export default function SupervisorDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'supervisor') {
      // If user is not supervisor, redirect them
      if (user.role === 'admin') router.push('/');
      else if (user.role === 'employee') router.push('/employee-dashboard');
      else router.push('/login');
    }
  }, [user, isLoading, router]);

  // Calculate supervisor-specific metrics
  const teamMembersCount = React.useMemo(() => {
    if (!user) return 0;
    return mockEmployees.filter(emp => emp.supervisorId === user.id).length;
  }, [user]);

  const pendingReviewsCount = React.useMemo(() => {
    if(!user) return 0;
    const supervisedEmployeeIds = mockEmployees
        .filter(emp => emp.supervisorId === user.id)
        .map(emp => emp.id);
    
    // This is a simplified logic. In a real app, you'd check for actual pending reviews.
    // For now, let's assume half of the team has a "pending" review if there are few scores.
    const teamScoresCount = mockPerformanceScores.filter(score => supervisedEmployeeIds.includes(score.employeeId)).length;
    return Math.max(0, Math.floor(teamMembersCount / 2) - teamScoresCount);

  }, [user, teamMembersCount]);

  if (isLoading || !user || user.role !== 'supervisor') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Supervisor Dashboard: ${user.name}`} description="Overview of your team's performance and tasks." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team Members</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{teamMembersCount}</div>
            <p className="text-xs text-muted-foreground">Active employees you supervise.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{pendingReviewsCount}</div>
            <p className="text-xs text-muted-foreground">Evaluations requiring your attention.</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Feedback Requests</CardTitle>
            <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">0</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Feedback you need to provide.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Tasks completed this cycle.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Team Overview (Coming Soon)</CardTitle>
                <CardDescription>Quick view of your team's recent activity and performance highlights.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Detailed team performance charts and summaries will be displayed here.</p>
            </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
