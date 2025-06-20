
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FileText, Star, CheckSquare, MessageSquarePlus, Bell } from "lucide-react";
import { mockPerformanceScores, mockWorkOutputs } from "@/lib/mockData"; // Assuming you have mock data

export default function EmployeeDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'employee') {
      // If user is not employee, redirect them
      if (user.role === 'admin') router.push('/');
      else if (user.role === 'supervisor') router.push('/supervisor-dashboard');
      else router.push('/login');
    }
  }, [user, isLoading, router]);

  const myPerformanceScoreCount = React.useMemo(() => {
    if(!user) return 0;
    return mockPerformanceScores.filter(score => score.employeeId === user.id).length;
  },[user]);

  const myWorkOutputCount = React.useMemo(() => {
     if(!user) return 0;
    return mockWorkOutputs.filter(output => output.employeeId === user.id).length;
  }, [user]);


  if (isLoading || !user || user.role !== 'employee') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

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
            <div className="text-3xl font-bold font-headline">N/A</div> {/* Placeholder */}
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
            <div className="text-3xl font-bold font-headline">0</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Tasks requiring your attention.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Notifications</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">N/A</div> {/* Placeholder */}
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
                <Button variant="outline" onClick={() => alert("Requesting feedback...")}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Request Feedback
                </Button>
            </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
