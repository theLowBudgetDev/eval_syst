
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecord, WorkOutput, AppUser, AttendanceStatusType } from "@/types"; // Use AttendanceStatusType
import { CalendarCheck, ListTodo, Search, Download, PlusCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ATTENDANCE_STATUSES: AttendanceStatusType[] = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"];

interface AttendanceFormData {
    employeeId: string;
    date: string; // YYYY-MM-DD
    status: AttendanceStatusType;
    notes?: string;
}
interface WorkOutputFormData {
    employeeId: string;
    title: string;
    submissionDate: string; // YYYY-MM-DD
    description?: string;
    fileUrl?: string;
}


export default function ProgressMonitorPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allEmployees, setAllEmployees] = React.useState<AppUser[]>([]);
  const [attendanceRecordsAll, setAttendanceRecordsAll] = React.useState<AttendanceRecord[]>([]);
  const [workOutputsAll, setWorkOutputsAll] = React.useState<WorkOutput[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [attendanceSearchTerm, setAttendanceSearchTerm] = React.useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = React.useState<AttendanceStatusType | "all">("all");
  const [attendanceDateFilter, setAttendanceDateFilter] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [workOutputSearchTerm, setWorkOutputSearchTerm] = React.useState("");
  const [workOutputEmployeeFilter, setWorkOutputEmployeeFilter] = React.useState<string>("all");
  
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = React.useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = React.useState<AttendanceRecord | null>(null);
  const [attendanceFormData, setAttendanceFormData] = React.useState<AttendanceFormData>({
    employeeId: "", date: format(new Date(), "yyyy-MM-dd"), status: "PRESENT", notes: ""
  });

  const [isWorkOutputFormOpen, setIsWorkOutputFormOpen] = React.useState(false);
  const [editingWorkOutput, setEditingWorkOutput] = React.useState<WorkOutput | null>(null);
  const [workOutputFormData, setWorkOutputFormData] = React.useState<WorkOutputFormData>({
    employeeId: "", title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: ""
  });


  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [attendanceRes, workOutputsRes, employeesRes] = await Promise.all([
        fetch("/api/attendance-records"),
        fetch("/api/work-outputs"),
        fetch("/api/users"),
      ]);

      if (!attendanceRes.ok) throw new Error("Failed to fetch attendance records");
      setAttendanceRecordsAll(await attendanceRes.json());

      if (!workOutputsRes.ok) throw new Error("Failed to fetch work outputs");
      setWorkOutputsAll(await workOutputsRes.json());

      if (!employeesRes.ok) throw new Error("Failed to fetch employees");
      setAllEmployees(await employeesRes.json());

    } catch (error) {
      toast({ title: "Error fetching data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
        router.push('/login');
      } else {
        fetchData();
      }
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, fetchData]);

  const getEmployeeName = (employeeId: string) => allEmployees.find(emp => emp.id === employeeId)?.name || "Unknown Employee";
  
  const supervisedEmployeeIds = React.useMemo(() => {
      if (user?.role === 'SUPERVISOR') {
          return allEmployees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id);
      }
      return [];
  }, [user, allEmployees]);

  const employeesForForms = React.useMemo(() => {
    if (user?.role === 'SUPERVISOR') return allEmployees.filter(emp => emp.supervisorId === user.id);
    if (user?.role === 'ADMIN') return allEmployees.filter(emp => emp.role === 'EMPLOYEE' || emp.role === 'SUPERVISOR'); // Admin can add for anyone
    return [];
  }, [user, allEmployees]);


  const filteredAttendanceRecords = React.useMemo(() => {
    let recordsToFilter = attendanceRecordsAll;
    if (user?.role === 'SUPERVISOR') {
        recordsToFilter = attendanceRecordsAll.filter(record => supervisedEmployeeIds.includes(record.employeeId));
    }
    return recordsToFilter.filter(record => {
        const employeeName = record.employee?.name?.toLowerCase() || getEmployeeName(record.employeeId).toLowerCase();
        const search = attendanceSearchTerm.toLowerCase();
        const matchesSearch = employeeName.includes(search) || record.notes?.toLowerCase().includes(search);
        const matchesStatus = attendanceStatusFilter === "all" || record.status === attendanceStatusFilter;
        const matchesDate = !attendanceDateFilter || format(new Date(record.date), "yyyy-MM-dd") === attendanceDateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });
  }, [attendanceRecordsAll, user, supervisedEmployeeIds, attendanceSearchTerm, attendanceStatusFilter, attendanceDateFilter, getEmployeeName]);

  const filteredWorkOutputs = React.useMemo(() => {
    let outputsToFilter = workOutputsAll;
     if (user?.role === 'SUPERVISOR') {
        outputsToFilter = workOutputsAll.filter(output => supervisedEmployeeIds.includes(output.employeeId));
    }
    return outputsToFilter.filter(output => {
        const employeeName = output.employee?.name?.toLowerCase() || getEmployeeName(output.employeeId).toLowerCase();
        const search = workOutputSearchTerm.toLowerCase();
        const matchesSearch = employeeName.includes(search) || output.title.toLowerCase().includes(search) || output.description?.toLowerCase().includes(search);
        const matchesEmployee = workOutputEmployeeFilter === "all" || output.employeeId === workOutputEmployeeFilter;
        return matchesSearch && matchesEmployee;
    });
  }, [workOutputsAll, user, supervisedEmployeeIds, workOutputSearchTerm, workOutputEmployeeFilter, getEmployeeName]);
  
  
  if (authIsLoading || isLoadingData || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }
  
  const canPerformWriteActions = user.role === 'ADMIN';

  // Attendance Form Handlers
  const handleOpenAttendanceForm = (record: AttendanceRecord | null = null) => {
    if (record) {
        setEditingAttendanceRecord(record);
        setAttendanceFormData({
            employeeId: record.employeeId,
            date: format(new Date(record.date), "yyyy-MM-dd"),
            status: record.status,
            notes: record.notes || ""
        });
    } else {
        setEditingAttendanceRecord(null);
        setAttendanceFormData({ employeeId: "", date: format(new Date(), "yyyy-MM-dd"), status: "PRESENT", notes: ""});
    }
    setIsAttendanceFormOpen(true);
  };

  const handleAttendanceFormSubmit = async () => {
    const method = editingAttendanceRecord ? 'PUT' : 'POST';
    const url = editingAttendanceRecord ? `/api/attendance-records/${editingAttendanceRecord.id}` : '/api/attendance-records';
    const payload = { ...attendanceFormData, date: new Date(attendanceFormData.date).toISOString()};

    try {
        const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
        if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to save attendance");}
        toast({title: `Attendance record ${editingAttendanceRecord ? 'updated' : 'added'}`});
        fetchData();
        setIsAttendanceFormOpen(false);
    } catch (error) {
        toast({title: "Error", description: (error as Error).message, variant: "destructive"});
    }
  };

  // Work Output Form Handlers
  const handleOpenWorkOutputForm = (output: WorkOutput | null = null) => {
     if (output) {
        setEditingWorkOutput(output);
        setWorkOutputFormData({
            employeeId: output.employeeId,
            title: output.title,
            submissionDate: format(new Date(output.submissionDate), "yyyy-MM-dd"),
            description: output.description || "",
            fileUrl: output.fileUrl || ""
        });
    } else {
        setEditingWorkOutput(null);
        setWorkOutputFormData({ employeeId: "", title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: ""});
    }
    setIsWorkOutputFormOpen(true);
  };

  const handleWorkOutputFormSubmit = async () => {
    const method = editingWorkOutput ? 'PUT' : 'POST';
    const url = editingWorkOutput ? `/api/work-outputs/${editingWorkOutput.id}` : '/api/work-outputs';
    const payload = {...workOutputFormData, submissionDate: new Date(workOutputFormData.submissionDate).toISOString()};

    try {
        const res = await fetch(url, {method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
        if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to save work output");}
        toast({title: `Work output ${editingWorkOutput ? 'updated' : 'added'}`});
        fetchData();
        setIsWorkOutputFormOpen(false);
    } catch (error) {
        toast({title: "Error", description: (error as Error).message, variant: "destructive"});
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Monitor"
        description="Monitor employee attendance, completed work, and overall progress."
        actions={
            <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Report export will be available soon."})}>
                <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
        }
      />

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="attendance"><CalendarCheck className="mr-2 h-4 w-4" />Attendance</TabsTrigger>
          <TabsTrigger value="work-outputs"><ListTodo className="mr-2 h-4 w-4" />Work Outputs</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Attendance Records</CardTitle>
                        <CardDescription>View and manage employee attendance.</CardDescription>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                        <Button onClick={() => handleOpenAttendanceForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Attendance
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by employee or notes..." 
                        className="pl-8 w-full"
                        value={attendanceSearchTerm}
                        onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                    />
                </div>
                <Input 
                    type="date" 
                    value={attendanceDateFilter}
                    onChange={(e) => setAttendanceDateFilter(e.target.value)}
                    className="w-full sm:w-auto"
                />
                <Select value={attendanceStatusFilter} onValueChange={(value) => setAttendanceStatusFilter(value as AttendanceStatusType | "all")}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ATTENDANCE_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceRecords.length > 0 ? filteredAttendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee?.name || getEmployeeName(record.employeeId)}</TableCell>
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
                      {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleOpenAttendanceForm(record)}>
                            <Edit className="mr-1 h-3 w-3"/> Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={(user.role === 'ADMIN' || user.role === 'SUPERVISOR') ? 5 : 4} className="h-24 text-center">
                            No attendance records found for the selected filters.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-outputs" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Work Outputs</CardTitle>
                        <CardDescription>Track submitted work and project deliverables.</CardDescription>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                        <Button onClick={() => handleOpenWorkOutputForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Work Output
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by employee, title, or description..." 
                        className="pl-8 w-full"
                        value={workOutputSearchTerm}
                        onChange={(e) => setWorkOutputSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={workOutputEmployeeFilter} onValueChange={setWorkOutputEmployeeFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees {user?.role === 'SUPERVISOR' && "(My Team)"}</SelectItem>
                    {allEmployees.filter(emp => user?.role === 'ADMIN' || (user?.role === 'SUPERVISOR' && supervisedEmployeeIds.includes(emp.id))).map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Description/Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOutputs.length > 0 ? filteredWorkOutputs.map((output) => (
                    <TableRow key={output.id}>
                      <TableCell className="font-medium">{output.employee?.name || getEmployeeName(output.employeeId)}</TableCell>
                      <TableCell>{output.title}</TableCell>
                      <TableCell>{format(new Date(output.submissionDate), "PP")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {output.description || (output.fileUrl ? <a href={output.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a> : "N/A")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenWorkOutputForm(output)}>
                            <Edit className="mr-1 h-3 w-3"/> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No work outputs found for the selected filters.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    {isAttendanceFormOpen && (
        <Dialog open={isAttendanceFormOpen} onOpenChange={setIsAttendanceFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingAttendanceRecord ? "Edit" : "Add"} Attendance Record</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="att-employee">Employee</Label>
                        <Select value={attendanceFormData.employeeId} onValueChange={val => setAttendanceFormData({...attendanceFormData, employeeId: val})} disabled={!!editingAttendanceRecord}>
                            <SelectTrigger id="att-employee"><SelectValue placeholder="Select Employee"/></SelectTrigger>
                            <SelectContent>
                                {employeesForForms.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="att-date">Date</Label>
                        <Input id="att-date" type="date" value={attendanceFormData.date} onChange={e => setAttendanceFormData({...attendanceFormData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="att-status">Status</Label>
                        <Select value={attendanceFormData.status} onValueChange={val => setAttendanceFormData({...attendanceFormData, status: val as AttendanceStatusType})}>
                            <SelectTrigger id="att-status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                            <SelectContent>
                                {ATTENDANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="att-notes">Notes</Label>
                        <Textarea id="att-notes" value={attendanceFormData.notes} onChange={e => setAttendanceFormData({...attendanceFormData, notes: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAttendanceFormOpen(false)}>Cancel</Button>
                    <Button onClick={handleAttendanceFormSubmit}>Save Record</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    {isWorkOutputFormOpen && (
         <Dialog open={isWorkOutputFormOpen} onOpenChange={setIsWorkOutputFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingWorkOutput ? "Edit" : "Add"} Work Output</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="wo-employee">Employee</Label>
                        <Select value={workOutputFormData.employeeId} onValueChange={val => setWorkOutputFormData({...workOutputFormData, employeeId: val})} disabled={!!editingWorkOutput}>
                            <SelectTrigger id="wo-employee"><SelectValue placeholder="Select Employee"/></SelectTrigger>
                            <SelectContent>
                                {employeesForForms.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="wo-title">Title</Label>
                        <Input id="wo-title" value={workOutputFormData.title} onChange={e => setWorkOutputFormData({...workOutputFormData, title: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="wo-subdate">Submission Date</Label>
                        <Input id="wo-subdate" type="date" value={workOutputFormData.submissionDate} onChange={e => setWorkOutputFormData({...workOutputFormData, submissionDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="wo-desc">Description</Label>
                        <Textarea id="wo-desc" value={workOutputFormData.description} onChange={e => setWorkOutputFormData({...workOutputFormData, description: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="wo-url">File URL</Label>
                        <Input id="wo-url" value={workOutputFormData.fileUrl} onChange={e => setWorkOutputFormData({...workOutputFormData, fileUrl: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWorkOutputFormOpen(false)}>Cancel</Button>
                    <Button onClick={handleWorkOutputFormSubmit}>Save Output</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}

    </div>
  );
}

    