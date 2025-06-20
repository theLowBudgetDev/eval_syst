
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Label } from "@/components/ui/label"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { WorkOutput, AttendanceRecord, AppUser } from "@/types";
import { FileText, CalendarCheck, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";


interface NewWorkOutputData {
  title: string;
  description?: string;
  fileUrl?: string;
  submissionDate: string; // YYYY-MM-DD
}

export default function MyProgressPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [myWorkOutputs, setMyWorkOutputs] = React.useState<WorkOutput[]>([]);
  const [myAttendance, setMyAttendance] = React.useState<AttendanceRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  
  const [isAddWorkDialogOpen, setIsAddWorkDialogOpen] = React.useState(false);
  const [newWorkOutput, setNewWorkOutput] = React.useState<NewWorkOutputData>({
    title: "",
    submissionDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    fileUrl: "",
  });

  const fetchData = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      // Fetch user data which might include work outputs and attendance, or fetch them separately
      const userDetailsRes = await fetch(`/api/users/${user.id}`);
      if (!userDetailsRes.ok) throw new Error("Failed to fetch user data");
      const userData: AppUser = await userDetailsRes.json();
      
      setMyWorkOutputs(userData.workOutputs || []);
      setMyAttendance((userData.attendanceRecords || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,10) );

    } catch (error) {
      toast({ title: "Error fetching data", description: (error as Error).message, variant: "destructive" });
      setMyWorkOutputs([]);
      setMyAttendance([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authIsLoading, router, fetchData]);

  if (authIsLoading || isLoadingData || !user) {
    return <div className="flex justify-center items-center h-screen">Loading progress...</div>;
  }

  const handleAddWorkOutput = async () => {
    if (!user || !newWorkOutput.title) {
        toast({ title: "Error", description: "Title is required for work output.", variant: "destructive"});
        return;
    }
    const payload: Omit<WorkOutput, 'id' | 'employee'> = {
        employeeId: user.id,
        ...newWorkOutput,
        submissionDate: new Date(newWorkOutput.submissionDate).toISOString(), // Ensure ISO string for API
    };

    try {
        const res = await fetch('/api/work-outputs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to add work output");
        }
        const addedOutput = await res.json();
        setMyWorkOutputs(prev => [addedOutput, ...prev]);
        toast({ title: "Work Output Added", description: `"${addedOutput.title}" has been recorded.`});
        setIsAddWorkDialogOpen(false);
        setNewWorkOutput({ title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: ""});
    } catch (error) {
         toast({ title: "Error Adding Output", description: (error as Error).message, variant: "destructive"});
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress Overview"
        description="Track your submitted work, attendance, and contributions."
        actions={
            <Button onClick={() => setIsAddWorkDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Work Output
            </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>My Work Outputs</CardTitle>
            <CardDescription>A list of your recently submitted work items.</CardDescription>
          </CardHeader>
          <CardContent>
            {myWorkOutputs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Description/Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myWorkOutputs.slice(0, 5).map((output) => ( // Show recent 5
                    <TableRow key={output.id}>
                      <TableCell className="font-medium">{output.title}</TableCell>
                      <TableCell>{format(new Date(output.submissionDate), "PP")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {output.description || (output.fileUrl ? <a href={output.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a> : "N/A")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-4 text-center">You haven't submitted any work outputs yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary"/>My Recent Attendance</CardTitle>
            <CardDescription>Your attendance summary for the last few records.</CardDescription>
          </CardHeader>
          <CardContent>
            {myAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "PP")}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={
                                record.status === "PRESENT" ? "default" :
                                record.status === "ON_LEAVE" ? "secondary" :
                                record.status === "LATE" ? "outline" : 
                                "destructive" // ABSENT
                            }
                            className={record.status === "LATE" ? "border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300" : ""}
                        >
                            {record.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.notes || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No recent attendance records found.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isAddWorkDialogOpen} onOpenChange={setIsAddWorkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Work Output</DialogTitle>
              <DialogDescription>
                Record a new piece of work you've completed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="wo-title">Title*</Label>
                <Input 
                    id="wo-title" 
                    value={newWorkOutput.title} 
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, title: e.target.value})}
                    placeholder="e.g., Q3 Marketing Report" 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-date">Submission Date</Label>
                <Input 
                    id="wo-date" 
                    type="date"
                    value={newWorkOutput.submissionDate} // Already YYYY-MM-DD
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, submissionDate: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-description">Description (Optional)</Label>
                <Textarea 
                    id="wo-description" 
                    value={newWorkOutput.description}
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, description: e.target.value})}
                    placeholder="Brief summary of the work done." 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-fileUrl">File URL (Optional)</Label>
                <Input 
                    id="wo-fileUrl" 
                    value={newWorkOutput.fileUrl}
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, fileUrl: e.target.value})}
                    placeholder="https://example.com/link/to/file" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddWorkDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddWorkOutput}>Add Output</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

    