
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockAttendanceRecords, mockWorkOutputs, mockEmployees } from "@/lib/mockData";
import type { AttendanceRecord, WorkOutput, AttendanceStatus } from "@/types";
import { CalendarCheck, ListTodo, Search, Download, PlusCircle } from "lucide-react"; // Removed User, Filter as they are not directly used or have placeholders
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


export default function ProgressMonitorPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [attendanceRecordsAll, setAttendanceRecordsAll] = React.useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [workOutputsAll, setWorkOutputsAll] = React.useState<WorkOutput[]>(mockWorkOutputs);

  const [attendanceSearchTerm, setAttendanceSearchTerm] = React.useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = React.useState<AttendanceStatus | "all">("all");
  const [attendanceDateFilter, setAttendanceDateFilter] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [workOutputSearchTerm, setWorkOutputSearchTerm] = React.useState("");
  const [workOutputEmployeeFilter, setWorkOutputEmployeeFilter] = React.useState<string>("all");


  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'supervisor') {
      router.push('/login'); // Or an unauthorized page for employees if this page is admin/supervisor only
    }
  }, [user, isLoading, router]);


  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find(emp => emp.id === employeeId)?.name || "Unknown Employee";
  };
  
  const supervisedEmployeeIds = React.useMemo(() => {
      if (user?.role === 'supervisor') {
          return mockEmployees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id);
      }
      return [];
  }, [user]);

  const filteredAttendanceRecords = React.useMemo(() => {
    let recordsToFilter = attendanceRecordsAll;
    if (user?.role === 'supervisor') {
        recordsToFilter = attendanceRecordsAll.filter(record => supervisedEmployeeIds.includes(record.employeeId));
    }

    return recordsToFilter.filter(record => {
        const employeeName = getEmployeeName(record.employeeId).toLowerCase();
        const search = attendanceSearchTerm.toLowerCase();
        const matchesSearch = employeeName.includes(search) || record.notes?.toLowerCase().includes(search);
        const matchesStatus = attendanceStatusFilter === "all" || record.status === attendanceStatusFilter;
        const matchesDate = !attendanceDateFilter || record.date === attendanceDateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });
  }, [attendanceRecordsAll, user, supervisedEmployeeIds, attendanceSearchTerm, attendanceStatusFilter, attendanceDateFilter]);

  const filteredWorkOutputs = React.useMemo(() => {
    let outputsToFilter = workOutputsAll;
     if (user?.role === 'supervisor') {
        outputsToFilter = workOutputsAll.filter(output => supervisedEmployeeIds.includes(output.employeeId));
    }
    
    return outputsToFilter.filter(output => {
        const employeeName = getEmployeeName(output.employeeId).toLowerCase();
        const search = workOutputSearchTerm.toLowerCase();
        const matchesSearch = employeeName.includes(search) || output.title.toLowerCase().includes(search) || output.description?.toLowerCase().includes(search);
        // If supervisor, employee filter should be from their team or all (of their team)
        const matchesEmployee = workOutputEmployeeFilter === "all" || output.employeeId === workOutputEmployeeFilter;
        return matchesSearch && matchesEmployee;
    });
  }, [workOutputsAll, user, supervisedEmployeeIds, workOutputSearchTerm, workOutputEmployeeFilter]);
  
  const attendanceStatuses: AttendanceStatus[] = ["Present", "Absent", "Late", "On Leave"];

  const employeesForFilter = React.useMemo(() => {
    if (user?.role === 'supervisor') {
        return mockEmployees.filter(emp => emp.supervisorId === user.id);
    }
    return mockEmployees; // Admin sees all
  }, [user]);


  if (isLoading || !user || (user.role !== 'admin' && user.role !== 'supervisor')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }
  
  const canPerformWriteActions = user.role === 'admin'; // Or supervisor for certain actions like adding notes


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
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View and manage employee attendance.</CardDescription>
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
                <Select value={attendanceStatusFilter} onValueChange={(value) => setAttendanceStatusFilter(value as AttendanceStatus | "all")}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {attendanceStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
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
                    {(user.role === 'admin' || user.role === 'supervisor') && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceRecords.length > 0 ? filteredAttendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>
                      <TableCell>{format(new Date(record.date), "MMMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={
                                record.status === "Present" ? "default" :
                                record.status === "On Leave" ? "secondary" :
                                record.status === "Late" ? "outline" : 
                                "destructive" // Absent
                            }
                            className={record.status === "Late" ? "border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300" : ""}
                        >
                            {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.notes || "N/A"}</TableCell>
                      {(user.role === 'admin' || user.role === 'supervisor') && (
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => toast({title: "Coming Soon", description: `Editing ${record.id} will be available soon.`})}>Edit</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={(user.role === 'admin' || user.role === 'supervisor') ? 5 : 4} className="h-24 text-center">
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
              <CardTitle>Work Outputs</CardTitle>
              <CardDescription>Track submitted work and project deliverables.</CardDescription>
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
                    <SelectItem value="all">All Employees {user?.role === 'supervisor' && "(My Team)"}</SelectItem>
                    {employeesForFilter.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {/* Admin or Supervisor can add work outputs (perhaps for others, or supervisor for their team) */}
                 {(user.role === 'admin' || user.role === 'supervisor') && (
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Adding new work output will be available soon."})}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Work Output
                    </Button>
                 )}
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
                      <TableCell className="font-medium">{getEmployeeName(output.employeeId)}</TableCell>
                      <TableCell>{output.title}</TableCell>
                      <TableCell>{format(new Date(output.submissionDate), "MMMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {output.description || (output.fileUrl ? <a href={output.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a> : "N/A")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => toast({title: "Coming Soon", description: `Viewing ${output.id} will be available soon.`})}>View Details</Button>
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
    </div>
  );
}
