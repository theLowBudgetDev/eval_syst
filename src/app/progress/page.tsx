
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
import type { AttendanceRecord, WorkOutput, Employee, AttendanceStatus } from "@/types";
import { CalendarCheck, ListTodo, User, Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

export default function ProgressMonitorPage() {
  const [attendanceRecords, setAttendanceRecords] = React.useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [workOutputs, setWorkOutputs] = React.useState<WorkOutput[]>(mockWorkOutputs);

  const [attendanceSearchTerm, setAttendanceSearchTerm] = React.useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = React.useState<AttendanceStatus | "all">("all");
  const [attendanceDateFilter, setAttendanceDateFilter] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [workOutputSearchTerm, setWorkOutputSearchTerm] = React.useState("");
  const [workOutputEmployeeFilter, setWorkOutputEmployeeFilter] = React.useState<string>("all");


  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find(emp => emp.id === employeeId)?.name || "Unknown Employee";
  };

  const filteredAttendanceRecords = attendanceRecords.filter(record => {
    const employeeName = getEmployeeName(record.employeeId).toLowerCase();
    const search = attendanceSearchTerm.toLowerCase();
    const matchesSearch = employeeName.includes(search) || record.notes?.toLowerCase().includes(search);
    const matchesStatus = attendanceStatusFilter === "all" || record.status === attendanceStatusFilter;
    const matchesDate = !attendanceDateFilter || record.date === attendanceDateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredWorkOutputs = workOutputs.filter(output => {
    const employeeName = getEmployeeName(output.employeeId).toLowerCase();
    const search = workOutputSearchTerm.toLowerCase();
    const matchesSearch = employeeName.includes(search) || output.title.toLowerCase().includes(search) || output.description?.toLowerCase().includes(search);
    const matchesEmployee = workOutputEmployeeFilter === "all" || output.employeeId === workOutputEmployeeFilter;
    return matchesSearch && matchesEmployee;
  });
  
  const attendanceStatuses: AttendanceStatus[] = ["Present", "Absent", "Late", "On Leave"];


  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Monitor"
        description="Monitor employee attendance, completed work, and overall progress."
        actions={
            <Button variant="outline">
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
                    <TableHead className="text-right">Actions</TableHead>
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
                                record.status === "Late" ? "outline" : // Consider a warning color
                                "destructive" // Absent
                            }
                            className={record.status === "Late" ? "border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300" : ""}
                        >
                            {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.notes || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => alert(`Editing ${record.id}`)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
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
                    <SelectItem value="all">All Employees</SelectItem>
                    {mockEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <Button variant="outline" onClick={() => alert("Adding new work output...")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Work Output
                </Button>
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
                        <Button variant="outline" size="sm" onClick={() => alert(`Viewing ${output.id}`)}>View Details</Button>
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
