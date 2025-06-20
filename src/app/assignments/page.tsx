
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AppUser } from "@/types";
import { UserPlus, UserCheck, Edit, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const NO_SUPERVISOR_VALUE = "--NONE--";

export default function SupervisorAssignmentsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = React.useState<AppUser[]>([]);
  const [supervisors, setSupervisors] = React.useState<AppUser[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<AppUser | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<string | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [employeesRes, supervisorsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/supervisors"),
      ]);

      if (!employeesRes.ok) {
        const errorBody = await employeesRes.json().catch(() => ({ message: `Failed to fetch employees (status ${employeesRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch employees (status ${employeesRes.status})`);
      }
      const employeesData = await employeesRes.json();
      setEmployees(employeesData);

      if (!supervisorsRes.ok) {
        const errorBody = await supervisorsRes.json().catch(() => ({ message: `Failed to fetch supervisors (status ${supervisorsRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch supervisors (status ${supervisorsRes.status})`);
      }
      const supervisorsData = await supervisorsRes.json();
      setSupervisors(supervisorsData);

    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
      setEmployees([]);
      setSupervisors([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'ADMIN') {
        router.push('/login');
      } else {
        fetchData();
      }
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, fetchData]);

  const handleOpenAssignDialog = (employee: AppUser) => {
    setSelectedEmployee(employee);
    setSelectedSupervisorId(employee.supervisorId);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSupervisor = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);

    const supervisorIdToAssign = selectedSupervisorId === NO_SUPERVISOR_VALUE || selectedSupervisorId === "" ? null : selectedSupervisorId;

    try {
      const res = await fetch('/api/assignments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee.id, supervisorId: supervisorIdToAssign }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to update assignment (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to update assignment (status ${res.status})`);
      }
      // const updatedEmployee = await res.json(); // The API returns the employee, we can use this to update state more precisely if needed.
      toast({
        title: "Assignment Updated",
        description: `${selectedEmployee.name}'s supervisor has been updated. Refreshing data...`,
      });
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (error) {
      toast({ title: "Error Updating Assignment", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsAssignDialogOpen(false);
      setSelectedEmployee(null);
      setSelectedSupervisorId(undefined);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.supervisor?.name && emp.supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authIsLoading || (isLoadingData && employees.length === 0)) { // Show skeleton if still loading initial data
    return (
      <div className="space-y-6">
        <PageHeader title="Supervisor Assignments" description="Assign and manage supervisors for employees."/>
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Card className="shadow-lg rounded-lg overflow-hidden">
           <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
           </div>
        </Card>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center h-screen">Unauthorized access.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Assignments"
        description="Assign and manage supervisors for employees."
        actions={
          <Button onClick={() => toast({ title: "Coming Soon", description: "Batch assign functionality is not yet implemented." })}>
            <UserPlus className="mr-2 h-4 w-4" /> Batch Assign Supervisors
          </Button>
        }
      />

      <div className="relative sm:max-w-xs mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search employees or supervisors..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-lg rounded-lg overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Current Supervisor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingData && filteredEmployees.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading assignments...</p>
                    </TableCell>
                </TableRow>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell><Badge variant="secondary">{employee.department}</Badge></TableCell>
                <TableCell>
                  {employee.supervisor?.name ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      {employee.supervisor.name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not Assigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleOpenAssignDialog(employee)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {employee.supervisorId ? "Change" : "Assign"} Supervisor
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No employees found matching your search.
                </TableCell>
              </TableRow>
          )}
          </TableBody>
        </Table>
      </Card>

      {selectedEmployee && (
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Supervisor to {selectedEmployee.name}</DialogTitle>
              <DialogDescription>
                Select a supervisor for {selectedEmployee.name}. Current: {selectedEmployee.supervisor?.name || "N/A"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select
                value={selectedSupervisorId === null || selectedSupervisorId === undefined ? NO_SUPERVISOR_VALUE : selectedSupervisorId}
                onValueChange={(value) => {
                  setSelectedSupervisorId(value === NO_SUPERVISOR_VALUE ? null : value);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="supervisor">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPERVISOR_VALUE}>
                    <em>Unassign (No Supervisor)</em>
                  </SelectItem>
                  {supervisors.map((supervisorUser) => (
                    <SelectItem key={supervisorUser.id} value={supervisorUser.id}>
                      {supervisorUser.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleAssignSupervisor} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
