
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FileText, Star, CheckSquare, MessageSquarePlus, Bell } from "lucide-react";
import type { AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch user data");
          return res.json();
        })
        .then(data => {
          setUserData(data);
        })
        .catch(err => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
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


  if (authIsLoading || isLoadingData || !user || user.role !== 'EMPLOYEE') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const latestScore = userData?.performanceScoresReceived && userData.performanceScoresReceived.length > 0 
    ? userData.performanceScoresReceived.sort((a,b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())[0].score
    : "N/A";

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}!`} description="Your personal performance and task overview." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Latest Evaluation</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{latestScore}{latestScore !== "N/A" ? "/5" : ""}</div>
            <p className="text-xs text-muted-foreground">Score from your most recent review.</p>
            <Button variant="link" className="px-0" onClick={() => router.push('/my-evaluations')}>View All ({myPerformanceScoreCount})</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submitted Work</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{myWorkOutputCount}</div>
            <p className="text-xs text-muted-foreground">Total work items you've submitted.</p>
            <Button variant="link" className="px-0" onClick={() => router.push('/my-progress')}>View All</Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">0</div> {/* Placeholder - needs backend logic */}
            <p className="text-xs text-muted-foreground">Tasks requiring your attention.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
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
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button onClick={() => router.push('/my-progress')}>
                    <FileText className="mr-2 h-4 w-4" /> Submit Work Output
                </Button>
                <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Request feedback functionality coming soon."})}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Request Feedback
                </Button>
            </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

    