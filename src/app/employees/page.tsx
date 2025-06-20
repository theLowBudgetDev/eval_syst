
"use client";

import * as React from "react";
import { PlusCircle, Edit, Trash2, Search, Filter, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { mockEmployees, mockSupervisors } from "@/lib/mockData";
import type { Employee } from "@/types";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const { toast } = useToast();

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
      toast({ title: "Employee Deleted", description: `${employeeToDelete.name} has been removed.` });
    }
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
    setSelectedEmployeeIds(prev => {
      const newSet = new Set(prev);
      if(employeeToDelete) newSet.delete(employeeToDelete.id);
      return newSet;
    });
  };

  const handleViewDetails = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsDetailDialogOpen(true);
  };

  const handleFormSubmit = (employeeData: Employee) => {
    if (editingEmployee) {
      setEmployees(
        employees.map((emp) => (emp.id === employeeData.id ? employeeData : emp))
      );
      toast({ title: "Employee Updated", description: `${employeeData.name}'s details have been updated.`});
    } else {
      const newEmployee = { ...employeeData, id: `emp${Date.now()}`}; // More unique ID
      setEmployees([...employees, newEmployee]);
      toast({ title: "Employee Added", description: `${newEmployee.name} has been added.`});
    }
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(emp => emp.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectRow = (employeeId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedEmployeeIds);
    if (checked) {
      newSelectedIds.add(employeeId);
    } else {
      newSelectedIds.delete(employeeId);
    }
    setSelectedEmployeeIds(newSelectedIds);
  };
  
  const handleDeleteSelected = () => {
    // This is a simplified bulk delete. In a real app, you'd confirm this action.
    const initialSize = employees.length;
    setEmployees(employees.filter(emp => !selectedEmployeeIds.has(emp.id)));
    setSelectedEmployeeIds(new Set());
    const numDeleted = initialSize - employees.filter(emp => !selectedEmployeeIds.has(emp.id)).length;
    if (numDeleted > 0) {
       toast({ title: "Employees Deleted", description: `${numDeleted} employee(s) have been removed.` });
    } else {
       toast({ title: "No Employees Selected", description: "Please select employees to delete.", variant: "destructive" });
    }
  };


  const isAllSelected = filteredEmployees.length > 0 && selectedEmployeeIds.size === filteredEmployees.length;
  const isIndeterminate = selectedEmployeeIds.size > 0 && selectedEmployeeIds.size < filteredEmployees.length;


  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        description="Manage employee information, performance, and roles."
        actions={
          <Button onClick={handleAddEmployee}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => alert("Filter functionality coming soon!")}>
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
        {selectedEmployeeIds.size > 0 && (
           <Button variant="destructive" onClick={handleDeleteSelected}>
             <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedEmployeeIds.size})
           </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                 <Checkbox 
                    checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
              </TableHead>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} data-state={selectedEmployeeIds.has(employee.id) ? "selected" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedEmployeeIds.has(employee.id)}
                      onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                      aria-label={`Select row for ${employee.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person photo" />
                      <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{employee.department}</Badge>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.supervisorName || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                           <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteEmployee(employee)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {isFormOpen && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          supervisors={mockSupervisors}
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete employee {employeeToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewingEmployee && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={viewingEmployee.avatarUrl} alt={viewingEmployee.name} data-ai-hint="person photo" />
                  <AvatarFallback>{viewingEmployee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {viewingEmployee.name}
              </DialogTitle>
              <DialogDescription>
                Detailed information for {viewingEmployee.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Email:</Label>
                <span>{viewingEmployee.email}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Department:</Label>
                <Badge variant="secondary">{viewingEmployee.department}</Badge>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Position:</Label>
                <span>{viewingEmployee.position}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Hire Date:</Label>
                <span>{format(new Date(viewingEmployee.hireDate), "MMMM d, yyyy")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Supervisor:</Label>
                <span>{viewingEmployee.supervisorName || "N/A"}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
