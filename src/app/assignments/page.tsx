
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [isBatchAssignDialogOpen, setIsBatchAssignDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [employeesRes, supervisorsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/supervisors"),
      ]);

      if (!employeesRes.ok) throw new Error(await employeesRes.text());
      const employeesData = await employeesRes.json();
      setEmployees(employeesData);

      if (!supervisorsRes.ok) throw new Error(await supervisorsRes.text());
      const supervisorsData = await supervisorsRes.json();
      setSupervisors(supervisorsData);

    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authIsLoading) {
      if (user?.role !== 'ADMIN') {
        router.push('/login');
      } else {
        fetchData();
      }
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
    const supervisorIdToAssign = selectedSupervisorId === NO_SUPERVISOR_VALUE ? null : selectedSupervisorId;

    try {
      const res = await fetch('/api/assignments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee.id, supervisorId: supervisorIdToAssign }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: "Assignment Updated",
        description: `${selectedEmployee.name}'s supervisor has been updated.`,
      });
      fetchData();
    } catch (error) {
      toast({ title: "Error Updating Assignment", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsAssignDialogOpen(false);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedEmployeeIds.size === 0 || selectedSupervisorId === undefined) return;
    setIsSubmitting(true);
    const supervisorIdToAssign = selectedSupervisorId === NO_SUPERVISOR_VALUE ? null : selectedSupervisorId;
    
    const headers = new Headers();
    headers.append('X-User-Id', user!.id);
    headers.append('X-User-Role', user!.role);
    headers.append('Content-Type', 'application/json');

    try {
        const res = await fetch('/api/assignments/batch-update', {
            method: 'POST',
            headers,
            body: JSON.stringify({ employeeIds: Array.from(selectedEmployeeIds), supervisorId: supervisorIdToAssign })
        });
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || "Batch assignment failed");
        }
        const result = await res.json();
        toast({ title: "Batch Assignment Successful", description: result.message });
        fetchData();
        setSelectedEmployeeIds(new Set());
    } catch(error) {
        toast({ title: "Error during Batch Assignment", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setIsBatchAssignDialogOpen(false);
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.supervisor?.name && emp.supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(emp => emp.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectRow = (employeeId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedEmployeeIds);
    if (checked) newSelectedIds.add(employeeId);
    else newSelectedIds.delete(employeeId);
    setSelectedEmployeeIds(newSelectedIds);
  };
  
  const isAllSelected = filteredEmployees.length > 0 && selectedEmployeeIds.size === filteredEmployees.length;
  const isIndeterminate = selectedEmployeeIds.size > 0 && !isAllSelected;

  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Supervisor Assignments" description="Assign and manage supervisors for employees."/>
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Card className="shadow-lg"><div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Assignments"
        description="Assign and manage supervisors for employees."
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative sm:max-w-xs w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search employees or supervisors..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        {selectedEmployeeIds.size > 0 && (
            <Button onClick={() => { setSelectedSupervisorId(undefined); setIsBatchAssignDialogOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" /> Batch Assign ({selectedEmployeeIds.size})
            </Button>
        )}
      </div>

      <Card className="shadow-lg rounded-lg border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    disabled={filteredEmployees.length === 0}
                />
              </TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Current Supervisor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
              <TableRow key={employee.id} data-state={selectedEmployeeIds.has(employee.id) && "selected"}>
                <TableCell>
                    <Checkbox
                        checked={selectedEmployeeIds.has(employee.id)}
                        onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                        aria-label={`Select row for ${employee.name}`}
                    />
                </TableCell>
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
                    {employee.supervisorId ? "Change" : "Assign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={6} className="h-24 text-center">No employees found.</TableCell></TableRow>
          )}
          </TableBody>
        </Table>
      </Card>

      {/* Single Edit Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Supervisor to {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Select a supervisor for {selectedEmployee?.name}. Current: {selectedEmployee?.supervisor?.name || "N/A"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="supervisor">Supervisor</Label>
            <Select
              value={selectedSupervisorId || NO_SUPERVISOR_VALUE}
              onValueChange={setSelectedSupervisorId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="supervisor"><SelectValue placeholder="Select a supervisor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUPERVISOR_VALUE}><em>Unassign (No Supervisor)</em></SelectItem>
                {supervisors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button onClick={handleAssignSupervisor} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Batch Assign Dialog */}
      <Dialog open={isBatchAssignDialogOpen} onOpenChange={setIsBatchAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Assign Supervisor</DialogTitle>
            <DialogDescription>
                Assign a new supervisor to the {selectedEmployeeIds.size} selected employees. This will overwrite their current supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="batch-supervisor">New Supervisor</Label>
            <Select
              value={selectedSupervisorId || NO_SUPERVISOR_VALUE}
              onValueChange={setSelectedSupervisorId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="batch-supervisor"><SelectValue placeholder="Select a supervisor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUPERVISOR_VALUE}><em>Unassign (No Supervisor)</em></SelectItem>
                {supervisors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button onClick={handleBatchAssign} disabled={isSubmitting || selectedSupervisorId === undefined}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply to {selectedEmployeeIds.size} Employees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
