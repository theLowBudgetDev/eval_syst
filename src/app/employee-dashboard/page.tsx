
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FileText, Star, CheckSquare, MessageSquarePlus, Bell, Loader2 } from "lucide-react";
import type { AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userData, setUserData] = React.useState<AppUser | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!authIsLoading && user && user.role !== 'EMPLOYEE') {
      if (user.role === 'ADMIN') router.push('/');
      else if (user.role === 'SUPERVISOR') router.push('/supervisor-dashboard');
      else router.push('/login');
    } else if (!authIsLoading && !user) {
      router.push('/login');
    } else if (user && user.role === 'EMPLOYEE') {
      setIsLoadingData(true);
      fetch(`/api/users/${user.id}`)
        .then(async res => {
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ message: `Failed to fetch user data (status ${res.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch user data (status ${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          setUserData(data);
        })
        .catch(err => {
          toast({ title: "Error Fetching Dashboard Data", description: (err as Error).message, variant: "destructive" });
          setUserData(null);
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [user, authIsLoading, router, toast]);

  const myPerformanceScoreCount = React.useMemo(() => {
    return userData?.performanceScoresReceived?.length || 0;
  }, [userData]);

  const myWorkOutputCount = React.useMemo(() => {
    return userData?.workOutputs?.length || 0;
  }, [userData]);

  const pendingTasksCount = React.useMemo(() => {
    if (!userData?.goalsAsEmployee) return 0;
    return userData.goalsAsEmployee.filter(g => g.status === 'IN_PROGRESS' || g.status === 'NOT_STARTED').length;
  }, [userData]);


  if (authIsLoading || !user || user.role !== 'EMPLOYEE') {
     return (
        <div className="space-y-6">
            <PageHeader title="Welcome!" description="Your personal performance and task overview."/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[150px] w-full rounded-lg" />)}
            </div>
            <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
    );
  }

  const latestScoreValue = userData?.performanceScoresReceived && userData.performanceScoresReceived.length > 0
    ? userData.performanceScoresReceived.sort((a,b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())[0].score
    : null;
  const latestScoreDisplay = latestScoreValue !== null ? `${latestScoreValue}/5` : "N/A";

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}!`} description="Your personal performance and task overview." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Latest Evaluation</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <Star className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-20 inline-block" /> : latestScoreDisplay}</div>
            <p className="text-xs text-muted-foreground">Score from your most recent review.</p>
            {isLoadingData ? <Skeleton className="h-5 w-24 mt-1" /> :
                <Button variant="link" className="px-0" onClick={() => router.push('/my-evaluations')}>View All ({myPerformanceScoreCount})</Button>
            }
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submitted Work</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <FileText className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12 inline-block" /> : myWorkOutputCount}</div>
            <p className="text-xs text-muted-foreground">Total work items you've submitted.</p>
            {isLoadingData ? <Skeleton className="h-5 w-16 mt-1" /> :
                <Button variant="link" className="px-0" onClick={() => router.push('/my-progress')}>View All</Button>
            }
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Goals</CardTitle>
            {isLoadingData ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/> : <CheckSquare className="h-5 w-5 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12 inline-block"/> : pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">Goals that are not yet completed.</p>
            {isLoadingData ? <Skeleton className="h-5 w-20 mt-1" /> : 
                <Button variant="link" className="px-0" onClick={() => router.push('/goals')}>View Goals</Button>
            }
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Notifications</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-headline">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">No new notifications.</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md border-border">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button onClick={() => router.push('/my-progress')} disabled={isLoadingData}>
                    <FileText className="mr-2 h-4 w-4" /> Submit Work Output
                </Button>
                <Button variant="outline" disabled title="Request feedback functionality coming soon.">
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Request Feedback
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
