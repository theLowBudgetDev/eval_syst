
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
import { FileText, CalendarCheck, PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


interface NewWorkOutputData {
  title: string;
  description?: string;
  fileUrl?: string; 
  submissionDate: string; // YYYY-MM-DD
  file?: File | null; // For actual file upload
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function MyProgressPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [myWorkOutputs, setMyWorkOutputs] = React.useState<WorkOutput[]>([]);
  const [myAttendance, setMyAttendance] = React.useState<AttendanceRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSubmittingWorkOutput, setIsSubmittingWorkOutput] = React.useState(false);
  
  const [isAddWorkDialogOpen, setIsAddWorkDialogOpen] = React.useState(false);
  const [newWorkOutput, setNewWorkOutput] = React.useState<NewWorkOutputData>({
    title: "",
    submissionDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    fileUrl: "",
    file: null,
  });
  const workOutputFileRef = React.useRef<HTMLInputElement>(null);

  const fetchData = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
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
    if (!authIsLoading && user) {
      fetchData();
    }
  }, [user, authIsLoading, fetchData]);


  const handleAddWorkOutput = async () => {
    if (!user || !newWorkOutput.title) {
        toast({ title: "Error", description: "Title is required for work output.", variant: "destructive"});
        return;
    }
    setIsSubmittingWorkOutput(true);

    let finalFileUrl = newWorkOutput.fileUrl;
    if (newWorkOutput.file) {
      try {
        finalFileUrl = await toBase64(newWorkOutput.file);
      } catch (error) {
        toast({ title: "File Upload Failed", description: "Could not read the selected image file.", variant: "destructive"});
        setIsSubmittingWorkOutput(false);
        return;
      }
    }

    const payload: Omit<WorkOutput, 'id' | 'employee'> = {
        employeeId: user.id,
        title: newWorkOutput.title,
        description: newWorkOutput.description,
        fileUrl: finalFileUrl,
        submissionDate: new Date(newWorkOutput.submissionDate).toISOString(),
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
        setMyWorkOutputs(prev => [addedOutput, ...prev].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()));
        toast({ title: "Work Output Added", description: `"${addedOutput.title}" has been recorded.`});
        setIsAddWorkDialogOpen(false);
        setNewWorkOutput({ title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: "", file: null});
        if (workOutputFileRef.current) workOutputFileRef.current.value = "";
    } catch (error) {
         toast({ title: "Error Adding Output", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmittingWorkOutput(false);
    }
  };
  
  if (authIsLoading || isLoadingData) {
    return (
        <div className="space-y-6">
            <PageHeader title="My Progress Overview" description="Track your submitted work, attendance, and contributions."/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
                <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
            </div>
        </div>
    );
  }

  if (!user) {
    return null; // Should be handled by AppContent redirect
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress Overview"
        description="Track your submitted work, attendance, and contributions."
        actions={
            <Button onClick={() => setIsAddWorkDialogOpen(true)} disabled={isSubmittingWorkOutput}>
                {isSubmittingWorkOutput ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                 Add Work Output
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
            <div className="overflow-x-auto">
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
                    {myWorkOutputs.slice(0, 5).map((output) => ( 
                      <TableRow key={output.id}>
                        <TableCell className="font-medium">{output.title}</TableCell>
                        <TableCell>{format(new Date(output.submissionDate), "PP")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {output.description || (output.fileUrl ? <a href={output.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Link</a> : "N/A")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-4 text-center">You haven't submitted any work outputs yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary"/>My Recent Attendance</CardTitle>
            <CardDescription>Your attendance summary for the last few records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                                  "destructive" 
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isAddWorkDialogOpen} onOpenChange={(open) => {if (!isSubmittingWorkOutput) setIsAddWorkDialogOpen(open)}}>
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
                    disabled={isSubmittingWorkOutput}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-date">Submission Date</Label>
                <Input 
                    id="wo-date" 
                    type="date"
                    value={newWorkOutput.submissionDate} 
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, submissionDate: e.target.value})}
                    disabled={isSubmittingWorkOutput}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-file">Attach File (Optional)</Label>
                <Input
                    id="wo-file"
                    type="file"
                    ref={workOutputFileRef}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewWorkOutput(prev => ({...prev, file}));
                        if (file) setNewWorkOutput(prev => ({...prev, fileUrl: ""})); // Clear URL if file is chosen
                    }}
                    disabled={isSubmittingWorkOutput}
                />
                {newWorkOutput.file && <p className="text-xs text-muted-foreground mt-1">Selected: {newWorkOutput.file.name}</p>}
              </div>
               <div className="space-y-1">
                <Label htmlFor="wo-fileUrl">Or Provide File URL (Optional)</Label>
                <Input 
                    id="wo-fileUrl" 
                    value={newWorkOutput.fileUrl}
                    onChange={(e) => {
                        setNewWorkOutput({...newWorkOutput, fileUrl: e.target.value});
                        if (e.target.value && workOutputFileRef.current) {
                             setNewWorkOutput(prev => ({...prev, file: null})); // Clear file if URL is typed
                             workOutputFileRef.current.value = "";
                        }
                    }}
                    placeholder="https://placehold.co/link/to/file" 
                    disabled={isSubmittingWorkOutput || !!newWorkOutput.file}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wo-description">Description (Optional)</Label>
                <Textarea 
                    id="wo-description" 
                    value={newWorkOutput.description}
                    onChange={(e) => setNewWorkOutput({...newWorkOutput, description: e.target.value})}
                    placeholder="Brief summary of the work done." 
                    disabled={isSubmittingWorkOutput}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddWorkDialogOpen(false)} disabled={isSubmittingWorkOutput}>Cancel</Button>
              <Button onClick={handleAddWorkOutput} disabled={isSubmittingWorkOutput || !newWorkOutput.title}>
                {isSubmittingWorkOutput && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Output
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
