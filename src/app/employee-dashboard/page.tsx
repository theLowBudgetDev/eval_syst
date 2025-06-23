
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function EmployeeDashboardPage() {
  const { user, isLoading: authIsLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userData, setUserData] = React.useState<AppUser | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'EMPLOYEE') {
        if (user.role === 'ADMIN') router.push('/');
        else if (user.role === 'SUPERVISOR') router.push('/supervisor-dashboard');
        else logout();
      } else {
        setIsLoadingData(true);
        fetch(`/api/users/${user.id}`)
          .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
          })
          .then(data => setUserData(data))
          .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }))
          .finally(() => setIsLoadingData(false));
      }
    }
  }, [user, authIsLoading, router, toast, logout]);

  const myPerformanceScoreCount = userData?.performanceScoresReceived?.length || 0;
  const myWorkOutputCount = userData?.workOutputs?.length || 0;
  const pendingTasksCount = userData?.goalsAsEmployee?.filter(g => g.status === 'IN_PROGRESS' || g.status === 'NOT_STARTED').length || 0;
  
  const handleRequestFeedback = async () => {
    if (!user?.supervisor || !feedbackMessage) {
        toast({ title: "Error", description: "Supervisor not found or message is empty.", variant: "destructive" });
        return;
    }
    setIsSubmittingFeedback(true);
    const goalPayload = {
        title: `Feedback Request from ${user.name}`,
        description: feedbackMessage,
        employeeId: user.supervisor.id,
        status: 'NOT_STARTED',
    };
    
    const headers = new Headers();
    headers.append('X-User-Id', user.id);
    headers.append('X-User-Role', user.role);
    headers.append('Content-Type', 'application/json');

    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers,
            body: JSON.stringify(goalPayload),
        });
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || "Failed to submit feedback request.");
        }
        toast({ title: "Feedback Requested", description: "Your supervisor has been notified." });
        setFeedbackMessage("");
        setIsFeedbackDialogOpen(false);
    } catch (error) {
        toast({ title: "Submission Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmittingFeedback(false);
    }
  };

  if (authIsLoading || isLoadingData) {
     return (
        <div className="space-y-6">
            <PageHeader title="Welcome!" description="Your personal performance and task overview."/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[150px] w-full rounded-lg" />)}
            </div>
            <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
    );
  }

  if (!user) {
    return null; // Should be handled by AppContent redirect
  }

  const latestScoreValue = userData?.performanceScoresReceived?.[0]?.score;
  const latestScoreDisplay = latestScoreValue !== undefined ? `${latestScoreValue}/5` : "N/A";

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}!`} description="Your personal performance and task overview." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Latest Evaluation</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-20" /> : latestScoreDisplay}</div>
            <p className="text-xs text-muted-foreground">Score from your most recent review.</p>
            <Button variant="link" className="px-0" onClick={() => router.push('/my-evaluations')}>View All ({myPerformanceScoreCount})</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submitted Work</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12" /> : myWorkOutputCount}</div>
            <p className="text-xs text-muted-foreground">Total work items you've submitted.</p>
            <Button variant="link" className="px-0" onClick={() => router.push('/my-progress')}>View All</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Goals</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{isLoadingData ? <Skeleton className="h-9 w-12"/> : pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">Goals that are not yet completed.</p>
            <Button variant="link" className="px-0" onClick={() => router.push('/goals')}>View Goals</Button>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md border-border">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="flex gap-4">
                <Button onClick={() => router.push('/my-progress')} disabled={isLoadingData}>
                    <FileText className="mr-2 h-4 w-4" /> Submit Work Output
                </Button>
                <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(true)} disabled={!user.supervisor}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Request Feedback
                </Button>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Feedback</DialogTitle>
                <DialogDescription>
                    Send a feedback request to your supervisor, {user.supervisor?.name || "N/A"}. You can add a specific question or topic.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="feedback-message" className="sr-only">Message</Label>
                <Textarea 
                    id="feedback-message"
                    placeholder="Optional: What would you like specific feedback on? (e.g., my latest project submission, communication skills...)"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                    disabled={isSubmittingFeedback}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} disabled={isSubmittingFeedback}>Cancel</Button>
                <Button onClick={handleRequestFeedback} disabled={isSubmittingFeedback}>
                    {isSubmittingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Send Request
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
