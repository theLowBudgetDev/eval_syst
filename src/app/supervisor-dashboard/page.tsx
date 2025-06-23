
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, MessageSquareWarning, CheckCircle2, Loader2 } from "lucide-react";
import type { AppUser, PerformanceScore, WorkOutput, Goal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

export default function SupervisorDashboardPage() {
  const { user, isLoading: authIsLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teamMembers, setTeamMembers] = React.useState<AppUser[]>([]);
  const [teamScores, setTeamScores] = React.useState<PerformanceScore[]>([]);
  const [teamWorkOutputs, setTeamWorkOutputs] = React.useState<WorkOutput[]>([]);
  const [teamGoals, setTeamGoals] = React.useState<Goal[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'SUPERVISOR') {
        if (user.role === 'ADMIN') router.push('/');
        else if (user.role === 'EMPLOYEE') router.push('/employee-dashboard');
        else logout();
      } else {
        setIsLoadingData(true);
        const headers = new Headers();
        headers.append('X-User-Id', user.id);
        headers.append('X-User-Role', user.role);

        Promise.all([
          fetch(`/api/users?supervisorId=${user.id}`),
          fetch(`/api/performance-scores`),
          fetch(`/api/work-outputs`),
          fetch(`/api/goals`, { headers }) // Fetch all goals visible to supervisor
        ]).then(async ([teamRes, scoresRes, workOutputsRes, goalsRes]) => {
          if (!teamRes.ok) {
            const errorBody = await teamRes.json().catch(() => ({ message: `Failed to fetch team (status ${teamRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch team (status ${teamRes.status})`);
          }
          const teamData: AppUser[] = await teamRes.json();
          setTeamMembers(teamData);
          const teamMemberIds = teamData.map(tm => tm.id);

          if (!scoresRes.ok) {
            const errorBody = await scoresRes.json().catch(() => ({ message: `Failed to fetch scores (status ${scoresRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch scores (status ${scoresRes.status})`);
          }
          const allScoresData: PerformanceScore[] = await scoresRes.json();
          setTeamScores(allScoresData.filter(score => teamMemberIds.includes(score.employeeId)));

          if (!workOutputsRes.ok) {
            const errorBody = await workOutputsRes.json().catch(() => ({ message: `Failed to fetch work outputs (status ${workOutputsRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch work outputs (status ${workOutputsRes.status})`);
          }
          const allWorkOutputsData: WorkOutput[] = await workOutputsRes.json();
          setTeamWorkOutputs(allWorkOutputsData.filter(output => teamMemberIds.includes(output.employeeId)));

          if (!goalsRes.ok) {
            const errorBody = await goalsRes.json().catch(() => ({ message: `Failed to fetch goals (status ${goalsRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch goals (status ${goalsRes.status})`);
          }
          const allGoalsData: Goal[] = await goalsRes.json();
          setTeamGoals(allGoalsData.filter(goal => teamMemberIds.includes(goal.employeeId)));


        }).catch(err => {
          toast({ title: "Error Fetching Dashboard Data", description: (err as Error).message, variant: "destructive" });
          setTeamMembers([]);
          setTeamScores([]);
          setTeamWorkOutputs([]);
        }).finally(() => setIsLoadingData(false));
      }
    }
  }, [user, authIsLoading, router, toast, logout]);

  const teamMembersCount = teamMembers.length;

  const pendingReviewsCount = React.useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return teamMembers.filter(member =>
        !teamScores.some(score => score.employeeId === member.id && new Date(score.evaluationDate) > threeMonthsAgo)
    ).length;
  }, [teamMembers, teamScores]);

  const completedTeamTasksCount = React.useMemo(() => {
    return teamGoals.filter(goal => goal.status === 'COMPLETED').length;
  }, [teamGoals]);

  const getScoreBadgeVariant = (scoreValue: number) => {
    if (scoreValue >= 4) return "default";
    if (scoreValue === 3) return "secondary";
    return "destructive";
  };

  if (authIsLoading || isLoadingData) {
     return (
        <div className="space-y-6">
            <PageHeader title="Supervisor Dashboard" description="Overview of your team's performance and tasks."/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-lg" />)}
            </div>
            <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
    );
  }
  
  if (!user) {
    return null; // Should be handled by AppContent redirect
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
            <CardTitle className="text-sm font-medium">Completed Goals (Team)</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12 inline-block"/> : completedTeamTasksCount}</div>
            <p className="text-xs text-muted-foreground">Team goals completed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
         <Card className="shadow-md border-border">
          <CardHeader>
            <CardTitle>Team Performance & Activity</CardTitle>
            <CardDescription>Recent evaluations and work submissions from your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingData ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Team Evaluations</h3>
                  {teamScores.length > 0 ? (
                    <ul className="space-y-3">
                      {teamScores.slice(0, 3).map(score => (
                        <li key={score.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm p-2 rounded-md border hover:bg-muted/50">
                          <div className="mb-1 sm:mb-0">
                            <span className="font-medium">{score.employee?.name || 'Unknown Employee'}</span>
                            <span className="text-muted-foreground mx-1 sm:mx-2">-</span>
                            <span className="text-muted-foreground">{score.criteria?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={getScoreBadgeVariant(score.score)}>{score.score}/5</Badge>
                             <span className="text-xs text-muted-foreground">{format(parseISO(score.evaluationDate), "PP")}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (<p className="text-muted-foreground text-sm">No recent evaluations for your team.</p>)}
                   <Button variant="link" className="px-0 mt-2 text-sm" onClick={() => router.push('/evaluations')}>View All Evaluations</Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Work Submissions</h3>
                  {teamWorkOutputs.length > 0 ? (
                     <ul className="space-y-3">
                      {teamWorkOutputs.slice(0, 3).map(output => (
                        <li key={output.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm p-2 rounded-md border hover:bg-muted/50">
                          <div className="mb-1 sm:mb-0">
                            <span className="font-medium">{output.employee?.name || 'Unknown Employee'}</span>
                            <span className="text-muted-foreground mx-1 sm:mx-2">-</span>
                            <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]" title={output.title}>{output.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{format(parseISO(output.submissionDate), "PP")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (<p className="text-muted-foreground text-sm">No recent work submissions from your team.</p>)}
                   <Button variant="link" className="px-0 mt-2 text-sm" onClick={() => router.push('/progress')}>View All Work Outputs</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
