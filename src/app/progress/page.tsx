
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
import type { AttendanceRecord, WorkOutput, AppUser, AttendanceStatusType } from "@/types";
import { CalendarCheck, ListTodo, Search, Download, PlusCircle, Edit, Loader2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

const ATTENDANCE_STATUSES: AttendanceStatusType[] = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"];

interface AttendanceFormData {
    employeeId: string;
    date: string;
    status: AttendanceStatusType;
    notes?: string;
}
interface WorkOutputFormData {
    employeeId: string;
    title: string;
    submissionDate: string;
    description?: string;
    fileUrl?: string;
    file?: File | null;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function convertToCSV(data: any[], headers: {key: string, label: string}[]): string {
    const headerRow = headers.map(h => h.label).join(',');
    const bodyRows = data.map(row => {
        return headers.map(header => {
            let value = row[header.key];
            if (header.key.includes('.')) {
                const keys = header.key.split('.');
                value = keys.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
            }
            const stringValue = value === null || value === undefined ? '' : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    });
    return [headerRow, ...bodyRows].join('\n');
}

function downloadCSV(csvString: string, filename: string) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function ProgressMonitorPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allEmployees, setAllEmployees] = React.useState<AppUser[]>([]);
  const [attendanceRecordsAll, setAttendanceRecordsAll] = React.useState<AttendanceRecord[]>([]);
  const [workOutputsAll, setWorkOutputsAll] = React.useState<WorkOutput[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [attendanceSearchTerm, setAttendanceSearchTerm] = React.useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = React.useState<AttendanceStatusType | "all">("all");
  const [attendanceDateFilter, setAttendanceDateFilter] = React.useState<string>("");

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
    employeeId: "", title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: "", file: null
  });
  const workOutputFileRefDialog = React.useRef<HTMLInputElement>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [attendanceRes, workOutputsRes, employeesRes] = await Promise.all([
        fetch("/api/attendance-records"), fetch("/api/work-outputs"), fetch("/api/users"),
      ]);
      if (!attendanceRes.ok) throw new Error("Failed to fetch attendance");
      setAttendanceRecordsAll(await attendanceRes.json());
      if (!workOutputsRes.ok) throw new Error("Failed to fetch work outputs");
      setWorkOutputsAll(await workOutputsRes.json());
      if (!employeesRes.ok) throw new Error("Failed to fetch employees");
      setAllEmployees(await employeesRes.json());
    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authIsLoading) {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
            router.push('/login');
        } else {
            fetchData();
        }
    }
  }, [user, authIsLoading, router, fetchData]);
  
  const getEmployeeName = React.useCallback((employeeId: string) => allEmployees.find(emp => emp.id === employeeId)?.name || "Unknown", [allEmployees]);
  
  const supervisedEmployeeIds = React.useMemo(() => user?.role === 'SUPERVISOR' ? allEmployees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id) : [], [user, allEmployees]);

  const employeesForForms = React.useMemo(() => {
    if (user?.role === 'SUPERVISOR') return allEmployees.filter(emp => emp.supervisorId === user.id);
    if (user?.role === 'ADMIN') return allEmployees.filter(emp => emp.role === 'EMPLOYEE' || emp.role === 'SUPERVISOR');
    return [];
  }, [user, allEmployees]);

  const filteredAttendanceRecords = React.useMemo(() => {
    let records = user?.role === 'SUPERVISOR' ? attendanceRecordsAll.filter(r => supervisedEmployeeIds.includes(r.employeeId)) : attendanceRecordsAll;
    return records.filter(r => 
        (r.employee?.name?.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) || getEmployeeName(r.employeeId).toLowerCase().includes(attendanceSearchTerm.toLowerCase()) || r.notes?.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) || false) &&
        (attendanceStatusFilter === "all" || r.status === attendanceStatusFilter) &&
        (!attendanceDateFilter || format(new Date(r.date), "yyyy-MM-dd") === attendanceDateFilter)
    );
  }, [attendanceRecordsAll, user, supervisedEmployeeIds, attendanceSearchTerm, attendanceStatusFilter, attendanceDateFilter, getEmployeeName]);

  const filteredWorkOutputs = React.useMemo(() => {
    let outputs = user?.role === 'SUPERVISOR' ? workOutputsAll.filter(o => supervisedEmployeeIds.includes(o.employeeId)) : workOutputsAll;
    return outputs.filter(o =>
        (o.employee?.name?.toLowerCase().includes(workOutputSearchTerm.toLowerCase()) || getEmployeeName(o.employeeId).toLowerCase().includes(workOutputSearchTerm.toLowerCase()) || o.title.toLowerCase().includes(workOutputSearchTerm.toLowerCase()) || o.description?.toLowerCase().includes(workOutputSearchTerm.toLowerCase()) || false) &&
        (workOutputEmployeeFilter === "all" || o.employeeId === workOutputEmployeeFilter)
    );
  }, [workOutputsAll, user, supervisedEmployeeIds, workOutputSearchTerm, workOutputEmployeeFilter, getEmployeeName]);
  
  const handleExport = (activeTab: 'attendance' | 'work-outputs') => {
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    if (activeTab === 'attendance') {
        if (filteredAttendanceRecords.length === 0) {
            toast({ title: "No Data to Export", description: "There are no attendance records matching the current filters.", variant: "default" });
            return;
        }
        const headers = [{key: 'employee.name', label: 'Employee'}, {key: 'date', label: 'Date'}, {key: 'status', label: 'Status'}, {key: 'notes', label: 'Notes'}];
        const csv = convertToCSV(filteredAttendanceRecords, headers);
        downloadCSV(csv, `attendance_report_${timestamp}.csv`);
    } else {
        if (filteredWorkOutputs.length === 0) {
            toast({ title: "No Data to Export", description: "There are no work outputs matching the current filters.", variant: "default" });
            return;
        }
        const headers = [{key: 'employee.name', label: 'Employee'}, {key: 'title', label: 'Title'}, {key: 'submissionDate', label: 'Submission Date'}, {key: 'description', label: 'Description'}, {key: 'fileUrl', label: 'File URL'}];
        const csv = convertToCSV(filteredWorkOutputs, headers);
        downloadCSV(csv, `work_outputs_report_${timestamp}.csv`);
    }
  };

  const handleOpenAttendanceForm = (record: AttendanceRecord | null = null) => {
    setEditingAttendanceRecord(record);
    setAttendanceFormData(record ? { ...record, date: format(new Date(record.date), "yyyy-MM-dd") } : { employeeId: "", date: format(new Date(), "yyyy-MM-dd"), status: "PRESENT", notes: "" });
    setIsAttendanceFormOpen(true);
  };
  
  const handleAttendanceFormSubmit = async () => {
    setIsSubmitting(true);
    const url = editingAttendanceRecord ? `/api/attendance-records/${editingAttendanceRecord.id}` : '/api/attendance-records';
    try {
        const res = await fetch(url, { method: editingAttendanceRecord ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(attendanceFormData)});
        if (!res.ok) throw new Error(await res.text());
        toast({title: `Attendance record ${editingAttendanceRecord ? 'updated' : 'added'}`});
        fetchData();
        setIsAttendanceFormOpen(false);
    } catch (error) {
        toast({title: "Error Saving Attendance", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOpenWorkOutputForm = (output: WorkOutput | null = null) => {
    setEditingWorkOutput(output);
    setWorkOutputFormData(output ? { ...output, submissionDate: format(new Date(output.submissionDate), "yyyy-MM-dd"), file: null } : { employeeId: "", title: "", submissionDate: format(new Date(), "yyyy-MM-dd"), description: "", fileUrl: "", file: null});
    if (workOutputFileRefDialog.current) workOutputFileRefDialog.current.value = "";
    setIsWorkOutputFormOpen(true);
  };
  
  const handleWorkOutputFormSubmit = async () => {
    setIsSubmitting(true);
    const url = editingWorkOutput ? `/api/work-outputs/${editingWorkOutput.id}` : '/api/work-outputs';
    let finalFileUrl = workOutputFormData.fileUrl;
    if (workOutputFormData.file) finalFileUrl = await toBase64(workOutputFormData.file);
    const payload = { ...workOutputFormData, fileUrl: finalFileUrl };
    try {
        const res = await fetch(url, {method: editingWorkOutput ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
        if (!res.ok) throw new Error(await res.text());
        toast({title: `Work output ${editingWorkOutput ? 'updated' : 'added'}`});
        fetchData();
        setIsWorkOutputFormOpen(false);
    } catch (error) {
        toast({title: "Error Saving Work Output", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authIsLoading || isLoadingData) return (
    <div className="space-y-6">
      <PageHeader title="Progress Monitor" description="Monitor employee attendance, completed work, and overall progress."/>
      <Skeleton className="h-10 w-full md:w-[400px]" />
      <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Progress Monitor" description="Monitor employee attendance, completed work, and overall progress." />
      <Tabs defaultValue="attendance" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="attendance"><CalendarCheck className="mr-2 h-4 w-4" />Attendance</TabsTrigger>
                <TabsTrigger value="work-outputs"><ListTodo className="mr-2 h-4 w-4" />Work Outputs</TabsTrigger>
            </TabsList>
            <Button variant="outline" onClick={() => handleExport(document.querySelector<HTMLButtonElement>('[data-state=active]')?.value as any)}>
                <Download className="mr-2 h-4 w-4" /> Export Current View
            </Button>
        </div>
        <TabsContent value="attendance" className="mt-6">
          <Card className="shadow-lg border-border">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Attendance Records</CardTitle>
                        <CardDescription>View and manage employee attendance.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenAttendanceForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
                </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8 w-full" value={attendanceSearchTerm} onChange={(e) => setAttendanceSearchTerm(e.target.value)} />
                </div>
                <Input type="date" value={attendanceDateFilter} onChange={(e) => setAttendanceDateFilter(e.target.value)} className="w-full sm:w-auto" placeholder="Filter by date"/>
                <Select value={attendanceStatusFilter} onValueChange={(v) => setAttendanceStatusFilter(v as any)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{ATTENDANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" onClick={() => setAttendanceDateFilter("")}>Clear Date</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAttendanceRecords.length > 0 ? filteredAttendanceRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.employee?.name || getEmployeeName(r.employeeId)}</TableCell><TableCell>{format(new Date(r.date), "PP")}</TableCell>
                      <TableCell><Badge variant={r.status === "PRESENT" ? "default" : r.status === "ON_LEAVE" ? "secondary" : "destructive"}>{r.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>{r.notes || "N/A"}</TableCell>
                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenAttendanceForm(r)}><Edit className="mr-1 h-3 w-3"/> Edit</Button></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">No records found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="work-outputs" className="mt-6">
           <Card className="shadow-lg border-border">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Work Outputs</CardTitle>
                        <CardDescription>Track submitted work and deliverables.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenWorkOutputForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Output</Button>
                </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8 w-full" value={workOutputSearchTerm} onChange={(e) => setWorkOutputSearchTerm(e.target.value)} />
                </div>
                <Select value={workOutputEmployeeFilter} onValueChange={setWorkOutputEmployeeFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by employee" /></SelectTrigger><SelectContent><SelectItem value="all">All Employees</SelectItem>{employeesForForms.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Description/Link</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredWorkOutputs.length > 0 ? filteredWorkOutputs.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.employee?.name || getEmployeeName(o.employeeId)}</TableCell><TableCell>{o.title}</TableCell><TableCell>{format(new Date(o.submissionDate), "PP")}</TableCell>
                      <TableCell className="truncate max-w-xs">{o.description || (o.fileUrl ? <a href={o.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Link</a> : "N/A")}</TableCell>
                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenWorkOutputForm(o)}><Edit className="mr-1 h-3 w-3"/> Edit</Button></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">No outputs found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms in Dialogs */}
      <Dialog open={isAttendanceFormOpen} onOpenChange={setIsAttendanceFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingAttendanceRecord ? "Edit" : "Add"} Attendance</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-1"><Label htmlFor="att-employee">Employee</Label><Select value={attendanceFormData.employeeId} onValueChange={v => setAttendanceFormData({...attendanceFormData, employeeId: v})} disabled={!!editingAttendanceRecord}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{employeesForForms.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="att-date">Date</Label><Input id="att-date" type="date" value={attendanceFormData.date} onChange={e => setAttendanceFormData({...attendanceFormData, date: e.target.value})}/></div>
            <div className="space-y-1"><Label htmlFor="att-status">Status</Label><Select value={attendanceFormData.status} onValueChange={v => setAttendanceFormData({...attendanceFormData, status: v as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ATTENDANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="att-notes">Notes</Label><Textarea id="att-notes" value={attendanceFormData.notes} onChange={e => setAttendanceFormData({...attendanceFormData, notes: e.target.value})}/></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setIsAttendanceFormOpen(false)}>Cancel</Button><Button onClick={handleAttendanceFormSubmit} disabled={isSubmitting || !attendanceFormData.employeeId}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isWorkOutputFormOpen} onOpenChange={setIsWorkOutputFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingWorkOutput ? "Edit" : "Add"} Work Output</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-1"><Label htmlFor="wo-employee">Employee</Label><Select value={workOutputFormData.employeeId} onValueChange={v => setWorkOutputFormData({...workOutputFormData, employeeId: v})} disabled={!!editingWorkOutput}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{employeesForForms.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="wo-title">Title</Label><Input id="wo-title" value={workOutputFormData.title} onChange={e => setWorkOutputFormData({...workOutputFormData, title: e.target.value})}/></div>
            <div className="space-y-1"><Label htmlFor="wo-date">Date</Label><Input id="wo-date" type="date" value={workOutputFormData.submissionDate} onChange={e => setWorkOutputFormData({...workOutputFormData, submissionDate: e.target.value})}/></div>
            <div className="space-y-1"><Label htmlFor="wo-file">File</Label><Input id="wo-file" type="file" ref={workOutputFileRefDialog} onChange={e => setWorkOutputFormData({...workOutputFormData, file: e.target.files?.[0] || null})}/></div>
            <div className="space-y-1"><Label htmlFor="wo-url">URL</Label><Input id="wo-url" value={workOutputFormData.fileUrl} onChange={e => setWorkOutputFormData({...workOutputFormData, fileUrl: e.target.value})} disabled={!!workOutputFormData.file}/></div>
            <div className="space-y-1"><Label htmlFor="wo-desc">Description</Label><Textarea id="wo-desc" value={workOutputFormData.description} onChange={e => setWorkOutputFormData({...workOutputFormData, description: e.target.value})}/></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setIsWorkOutputFormOpen(false)}>Cancel</Button><Button onClick={handleWorkOutputFormSubmit} disabled={isSubmitting || !workOutputFormData.employeeId || !workOutputFormData.title}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
