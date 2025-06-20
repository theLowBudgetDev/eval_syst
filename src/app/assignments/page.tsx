
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
import { mockEmployees, mockSupervisors } from "@/lib/mockData";
import type { Employee } from "@/types"; 
import { UserPlus, UserCheck, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const NO_SUPERVISOR_VALUE = "--NONE--";

export default function SupervisorAssignmentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = React.useState<Employee[]>(
    mockEmployees.map(emp => ({
      ...emp,
      supervisorName: mockSupervisors.find(s => s.id === emp.supervisorId)?.name || "N/A"
    }))
  );
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/login'); // Or an unauthorized page
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const handleOpenAssignDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedSupervisorId(employee.supervisorId); 
    setIsAssignDialogOpen(true);
  };

  const handleAssignSupervisor = () => {
    if (selectedEmployee && selectedSupervisorId && selectedSupervisorId !== NO_SUPERVISOR_VALUE) {
      const supervisorName = mockSupervisors.find(s => s.id === selectedSupervisorId)?.name || "N/A";
      const updatedAssignments = assignments.map((emp) =>
        emp.id === selectedEmployee.id
          ? { ...emp, supervisorId: selectedSupervisorId, supervisorName: supervisorName }
          : emp
      );
      setAssignments(updatedAssignments);
      // Update mockEmployees as well if it's the source of truth for other pages
      const employeeIndex = mockEmployees.findIndex(emp => emp.id === selectedEmployee.id);
      if (employeeIndex !== -1) {
        mockEmployees[employeeIndex] = { ...mockEmployees[employeeIndex], supervisorId: selectedSupervisorId, supervisorName: supervisorName };
      }
      toast({
        title: "Supervisor Assigned",
        description: `${supervisorName} assigned to ${selectedEmployee.name}.`,
      });
    } else if (selectedEmployee && (!selectedSupervisorId || selectedSupervisorId === NO_SUPERVISOR_VALUE)) { 
       const updatedAssignments = assignments.map((emp) =>
        emp.id === selectedEmployee.id
          ? { ...emp, supervisorId: undefined, supervisorName: "N/A" }
          : emp
      );
      setAssignments(updatedAssignments);
      const employeeIndex = mockEmployees.findIndex(emp => emp.id === selectedEmployee.id);
      if (employeeIndex !== -1) {
        mockEmployees[employeeIndex] = { ...mockEmployees[employeeIndex], supervisorId: undefined, supervisorName: "N/A" };
      }
      toast({
        title: "Supervisor Unassigned",
        description: `Supervisor unassigned from ${selectedEmployee.name}.`,
      });
    }
    setIsAssignDialogOpen(false);
    setSelectedEmployee(null);
    setSelectedSupervisorId(undefined);
  };
  
  const filteredAssignments = assignments.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.supervisorName && emp.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Assignments"
        description="Assign and manage supervisors for employees."
        actions={
          <Button onClick={() => alert("Batch assign functionality coming soon!")}>
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

      <Card className="shadow-lg rounded-lg overflow-hidden">
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
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell><Badge variant="secondary">{employee.department}</Badge></TableCell>
                <TableCell>
                  {employee.supervisorName && employee.supervisorName !== "N/A" ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      {employee.supervisorName}
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
                  No employees found for assignment.
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
                Select a supervisor for {selectedEmployee.name}. Current: {selectedEmployee.supervisorName || "N/A"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select
                value={selectedSupervisorId === undefined ? NO_SUPERVISOR_VALUE : selectedSupervisorId}
                onValueChange={(value) => {
                  setSelectedSupervisorId(value === NO_SUPERVISOR_VALUE ? undefined : value);
                }}
              >
                <SelectTrigger id="supervisor">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPERVISOR_VALUE}>
                    <em>Unassign (No Supervisor)</em>
                  </SelectItem>
                  {mockSupervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAssignSupervisor}>Save Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
