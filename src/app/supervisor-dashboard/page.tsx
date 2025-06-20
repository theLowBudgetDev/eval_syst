
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, MessageSquareWarning, CheckCircle2, Loader2 } from "lucide-react";
import type { AppUser, PerformanceScore } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupervisorDashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teamMembers, setTeamMembers] = React.useState<AppUser[]>([]);
  const [teamScores, setTeamScores] = React.useState<PerformanceScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'SUPERVISOR') {
        if (user.role === 'ADMIN') router.push('/');
        else if (user.role === 'EMPLOYEE') router.push('/employee-dashboard');
        else router.push('/login');
      } else {
        setIsLoadingData(true);
        Promise.all([
          fetch(`/api/users?supervisorId=${user.id}`),
          fetch(`/api/performance-scores`)
        ]).then(async ([teamRes, scoresRes]) => {
          if (!teamRes.ok) {
            const errorBody = await teamRes.json().catch(() => ({ message: `Failed to fetch team (status ${teamRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch team (status ${teamRes.status})`);
          }
          const teamData: AppUser[] = await teamRes.json();
          setTeamMembers(teamData);

          if (!scoresRes.ok) {
            const errorBody = await scoresRes.json().catch(() => ({ message: `Failed to fetch scores (status ${scoresRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch scores (status ${scoresRes.status})`);
          }
          const allScores: PerformanceScore[] = await scoresRes.json();
          const teamMemberIds = teamData.map(tm => tm.id);
          setTeamScores(allScores.filter(score => teamMemberIds.includes(score.employeeId)));

        }).catch(err => {
          toast({ title: "Error Fetching Dashboard Data", description: (err as Error).message, variant: "destructive" });
          setTeamMembers([]);
          setTeamScores([]);
        }).finally(() => setIsLoadingData(false));
      }
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, toast]);

  const teamMembersCount = teamMembers.length;

  const pendingReviewsCount = React.useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return teamMembers.filter(member =>
        !teamScores.some(score => score.employeeId === member.id && new Date(score.evaluationDate) > threeMonthsAgo)
    ).length;
  }, [teamMembers, teamScores]);

  if (authIsLoading || !user || user.role !== 'SUPERVISOR') {
     return (
        <div className="space-y-6">
            <PageHeader title="Supervisor Dashboard" description="Overview of your team's performance and tasks."/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-lg" />)}
            </div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Supervisor Dashboard: ${user.name}`} description="Overview of your team's performance and tasks." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team Members</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <Users className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12 inline-block"/> : teamMembersCount}</div>
            <p className="text-xs text-muted-foreground">Active employees you supervise.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <ClipboardList className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12 inline-block"/> : pendingReviewsCount}</div>
            <p className="text-xs text-muted-foreground">Evaluations due or upcoming.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Feedback Requests</CardTitle>
            <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">0</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Feedback you need to provide.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks (Team)</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-headline">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Team tasks completed this cycle.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md border-border">
            <CardHeader>
                <CardTitle>Team Overview (Coming Soon)</CardTitle>
                <CardDescription>Quick view of your team's recent activity and performance highlights.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingData ? <Skeleton className="h-24 w-full"/> : <p className="text-muted-foreground">Detailed team performance charts and summaries will be displayed here.</p>}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
