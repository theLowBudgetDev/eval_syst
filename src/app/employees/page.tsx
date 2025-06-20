
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
import type { AppUser, UserRoleType } from "@/types"; // Updated import
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function EmployeesPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = React.useState<AppUser[]>([]);
  const [supervisorsForForm, setSupervisorsForForm] = React.useState<AppUser[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<AppUser | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<AppUser | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEmployee, setViewingEmployee] = React.useState<AppUser | null>(null);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const usersRes = await fetch("/api/users");
      if (!usersRes.ok) throw new Error("Failed to fetch users");
      const usersData = await usersRes.json();
      setEmployees(usersData);

      const supervisorsRes = await fetch("/api/supervisors");
      if (!supervisorsRes.ok) throw new Error("Failed to fetch supervisors");
      const supervisorsData = await supervisorsRes.json();
      setSupervisorsForForm(supervisorsData);

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

  const filteredEmployees = React.useMemo(() => {
    let displayEmployees = employees;
    // Supervisors see only employees they supervise directly, or themselves.
    // Admins see all.
    if (user?.role === 'SUPERVISOR') {
      displayEmployees = employees.filter(emp => emp.supervisorId === user.id || emp.id === user.id);
    }
    
    return displayEmployees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm, user]);

  if (authIsLoading || isLoadingData) {
    return <div className="flex justify-center items-center h-screen">Loading employee data...</div>;
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return <div className="flex justify-center items-center h-screen">Unauthorized access.</div>;
  }
  
  const canPerformWriteActions = user.role === 'ADMIN';

  const handleAddEmployee = () => {
    if (!canPerformWriteActions) return;
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: AppUser) => {
    // Admin can edit anyone. Supervisor can edit self.
    if (!canPerformWriteActions && !(user.role === 'SUPERVISOR' && user.id === employee.id)) {
         toast({ title: "Permission Denied", description: "You do not have permission to edit this employee.", variant: "destructive" });
        return;
    }
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleDeleteEmployee = (employee: AppUser) => {
    if (!canPerformWriteActions) return;
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!canPerformWriteActions || !employeeToDelete) return;
    
    try {
      const res = await fetch(`/api/users/${employeeToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete employee");
      }
      toast({ title: "Employee Deleted", description: `${employeeToDelete.name} has been removed.` });
      fetchData(); // Refetch data
      setSelectedEmployeeIds(prev => {
        const newSet = new Set(prev);
        if(employeeToDelete) newSet.delete(employeeToDelete.id);
        return newSet;
      });
    } catch (error) {
      toast({ title: "Error deleting employee", description: (error as Error).message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  const handleViewDetails = (employee: AppUser) => {
    setViewingEmployee(employee);
    setIsDetailDialogOpen(true);
  };

  const handleFormSubmit = async (employeeData: AppUser) => {
     // Admin can edit/add. Supervisor can only edit self (if form allows).
    if (!canPerformWriteActions && !(editingEmployee && editingEmployee.id === user?.id && user.role === 'SUPERVISOR')) {
        toast({ title: "Permission Denied", description: "You do not have permission to perform this action.", variant: "destructive" });
        return;
    }

    const method = editingEmployee ? 'PUT' : 'POST';
    const url = editingEmployee ? `/api/users/${editingEmployee.id}` : '/api/users';

    // Ensure hireDate is just the date string if it includes time
    const payload = { ...employeeData, hireDate: employeeData.hireDate.split('T')[0] };
    if (!editingEmployee) { // For new employee, ID is not sent, backend generates
      delete (payload as any).id;
    }


    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${editingEmployee ? 'update' : 'add'} employee`);
      }
      toast({ title: `Employee ${editingEmployee ? 'Updated' : 'Added'}`, description: `${employeeData.name}'s details have been ${editingEmployee ? 'updated' : 'added'}.`});
      fetchData(); // Refetch data
    } catch (error) {
      toast({ title: `Error ${editingEmployee ? 'updating' : 'adding'} employee`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormOpen(false);
      setEditingEmployee(null);
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (!canPerformWriteActions) return;
    if (checked === true) {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(emp => emp.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectRow = (employeeId: string, checked: boolean) => {
    if (!canPerformWriteActions) return;
    const newSelectedIds = new Set(selectedEmployeeIds);
    if (checked) {
      newSelectedIds.add(employeeId);
    } else {
      newSelectedIds.delete(employeeId);
    }
    setSelectedEmployeeIds(newSelectedIds);
  };
  
  const handleDeleteSelected = async () => {
    if (!canPerformWriteActions || selectedEmployeeIds.size === 0) {
        toast({ title: "Action Not Allowed", description: "You do not have permission or no employees selected.", variant: "destructive" });
        return;
    }
    
    let deletedCount = 0;
    let errorOccurred = false;
    for (const id of selectedEmployeeIds) {
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(`Failed for ${id}: ${errorData.message}`);
            }
            deletedCount++;
        } catch (error) {
            toast({ title: "Error deleting employee", description: (error as Error).message, variant: "destructive" });
            errorOccurred = true;
        }
    }

    if (deletedCount > 0) {
       toast({ title: "Employees Deleted", description: `${deletedCount} employee(s) have been removed.` });
    }
    if (!errorOccurred && deletedCount === 0){
        toast({ title: "No Employees Deleted", description: "Selected employees might have already been removed or an issue occurred.", variant: "default" });
    }
    
    fetchData(); // Refetch data
    setSelectedEmployeeIds(new Set());
  };


  const isAllSelected = filteredEmployees.length > 0 && selectedEmployeeIds.size === filteredEmployees.length;
  const isIndeterminate = selectedEmployeeIds.size > 0 && selectedEmployeeIds.size < filteredEmployees.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        description="Manage employee information, performance, and roles."
        actions={
          canPerformWriteActions && (
            <Button onClick={handleAddEmployee}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          )
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
        <Button variant="outline" onClick={() => toast({title: "Filter Clicked", description: "Filter functionality coming soon!"})}>
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
        {canPerformWriteActions && selectedEmployeeIds.size > 0 && (
           <Button variant="destructive" onClick={handleDeleteSelected}>
             <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedEmployeeIds.size})
           </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {canPerformWriteActions && (
                <TableHead className="w-[50px]">
                   <Checkbox 
                      checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                </TableHead>
              )}
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} data-state={selectedEmployeeIds.has(employee.id) ? "selected" : ""}>
                  {canPerformWriteActions && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedEmployeeIds.has(employee.id)}
                        onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                        aria-label={`Select row for ${employee.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} data-ai-hint="person photo" />
                      <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{employee.department}</Badge>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell><Badge variant="outline">{employee.role.charAt(0) + employee.role.slice(1).toLowerCase()}</Badge></TableCell>
                  <TableCell>{employee.supervisor?.name || "N/A"}</TableCell>
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
                        {(canPerformWriteActions || (user.role === 'SUPERVISOR' && user.id === employee.id)) && (
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {canPerformWriteActions && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteEmployee(employee)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canPerformWriteActions ? 9 : 8} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {isFormOpen && (canPerformWriteActions || (editingEmployee && editingEmployee.id === user?.id)) && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          supervisors={supervisorsForForm}
          canEditAllFields={canPerformWriteActions || (!!editingEmployee && user.id === editingEmployee.id)} // User can edit own avatar/limited fields, admin can edit all
        />
      )}

      {showDeleteConfirm && canPerformWriteActions && employeeToDelete && (
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
      )}

      {viewingEmployee && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={viewingEmployee.avatarUrl || undefined} alt={viewingEmployee.name} data-ai-hint="person photo" />
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
                <Label className="text-muted-foreground">Role:</Label>
                <Badge variant="outline">{viewingEmployee.role.charAt(0) + viewingEmployee.role.slice(1).toLowerCase()}</Badge>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Hire Date:</Label>
                <span>{format(new Date(viewingEmployee.hireDate), "MMMM d, yyyy")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-muted-foreground">Supervisor:</Label>
                <span>{viewingEmployee.supervisor?.name || "N/A"}</span>
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
