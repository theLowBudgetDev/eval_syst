
"use client";

import * as React from "react";
import { PlusCircle, Edit, Trash2, Search, Filter, MoreHorizontal, Eye, Loader2, ArrowUpDown } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppUser, UserRoleType } from "@/types";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

type SortableKey = keyof Pick<AppUser, 'name' | 'email' | 'department' | 'position' | 'hireDate' | 'role'> | 'supervisorName';
type SortDirection = 'asc' | 'desc';

const USER_ROLES_OPTIONS: UserRoleType[] = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];

export default function EmployeesPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = React.useState<AppUser[]>([]);
  const [supervisorsForForm, setSupervisorsForForm] = React.useState<AppUser[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<UserRoleType | "all">("all");
  
  const [sortColumn, setSortColumn] = React.useState<SortableKey>('name');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<AppUser | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEmployee, setViewingEmployee] = React.useState<AppUser | null>(null);
  const { toast } = useToast();

  const uniqueDepartments = React.useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const usersRes = await fetch("/api/users");
      if (!usersRes.ok) {
        const errorBody = await usersRes.json().catch(() => ({ message: `Failed to fetch users (status ${usersRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch users (status ${usersRes.status})`);
      }
      const usersData = await usersRes.json();
      setEmployees(usersData);

      if(user?.role === 'ADMIN') {
        const supervisorsRes = await fetch("/api/supervisors");
        if (!supervisorsRes.ok) {
            const errorBody = await supervisorsRes.json().catch(() => ({ message: `Failed to fetch supervisors (status ${supervisorsRes.status}, non-JSON response)` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to fetch supervisors (status ${supervisorsRes.status})`);
        }
        setSupervisorsForForm(await supervisorsRes.json());
      }

    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
      setEmployees([]);
      setSupervisorsForForm([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast, user?.role]);

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

  const handleSort = (column: SortableKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedEmployees = React.useMemo(() => {
    let displayEmployees = employees;
    if (user?.role === 'SUPERVISOR') {
      displayEmployees = employees.filter(emp => emp.supervisorId === user.id || emp.id === user.id);
    }

    displayEmployees = displayEmployees.filter(
      (employee) =>
        (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (departmentFilter === "all" || employee.department === departmentFilter) &&
        (roleFilter === "all" || employee.role === roleFilter)
    );
    
    return [...displayEmployees].sort((a, b) => {
        let aValue: any = a[sortColumn as keyof AppUser];
        let bValue: any = b[sortColumn as keyof AppUser];

        if (sortColumn === 'supervisorName') {
            aValue = a.supervisor?.name || '';
            bValue = b.supervisor?.name || '';
        } else if (sortColumn === 'hireDate') {
            aValue = parseISO(a.hireDate).getTime();
            bValue = parseISO(b.hireDate).getTime();
        }
        
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
             return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });
  }, [employees, searchTerm, user, departmentFilter, roleFilter, sortColumn, sortDirection]);

  const canPerformAdminActions = user?.role === 'ADMIN';

  const handleAddEmployee = () => {
    if (!canPerformAdminActions) {
         toast({ title: "Permission Denied", description: "Only administrators can add new employees.", variant: "destructive" });
        return;
    }
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: AppUser) => {
    if (!canPerformAdminActions && !(user?.role === 'SUPERVISOR' && user.id === employee.id)) {
         toast({ title: "Permission Denied", description: "You do not have permission to edit this employee.", variant: "destructive" });
        return;
    }
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = (employee: AppUser) => {
    if (!canPerformAdminActions) {
        toast({ title: "Permission Denied", description: "Only administrators can delete employees.", variant: "destructive" });
        return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!canPerformAdminActions || !employeeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${employeeToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to delete employee (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to delete employee (status ${res.status})`);
      }
      toast({ title: "Employee Deleted", description: `${employeeToDelete.name} has been removed.` });
      fetchData();
      setSelectedEmployeeIds(prev => {
        const newSet = new Set(prev);
        if(employeeToDelete) newSet.delete(employeeToDelete.id);
        return newSet;
      });
    } catch (error) {
      toast({ title: "Error Deleting Employee", description: (error as Error).message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleViewDetails = (employee: AppUser) => {
    setViewingEmployee(employee);
    setIsDetailDialogOpen(true);
  };

  const handleFormSubmit = async (employeeData: AppUser, isEditing: boolean) => {
    if (!user) return;
    if (!canPerformAdminActions && !(isEditing && employeeData.id === user.id && (user.role === 'SUPERVISOR' || user.role === 'EMPLOYEE'))) {
        toast({ title: "Permission Denied", description: "You do not have permission to perform this action.", variant: "destructive" });
        return;
    }
    setIsSubmittingForm(true);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/users/${employeeData.id}` : '/api/users';

    const payload = { ...employeeData, hireDate: employeeData.hireDate.split('T')[0] };
    if (!isEditing) {
      delete (payload as any).id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to ${isEditing ? 'update' : 'add'} employee (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to ${isEditing ? 'update' : 'add'} employee (status ${res.status})`);
      }
      toast({ title: `Employee ${isEditing ? 'Updated' : 'Added'}`, description: `${employeeData.name}'s details have been saved.`});
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: `Error ${isEditing ? 'Updating' : 'Adding'} Employee`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
      setEditingEmployee(null);
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (!canPerformAdminActions) return;
    if (checked === true) {
      setSelectedEmployeeIds(new Set(filteredAndSortedEmployees.map(emp => emp.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectRow = (employeeId: string, checked: boolean) => {
    if (!canPerformAdminActions) return;
    const newSelectedIds = new Set(selectedEmployeeIds);
    if (checked) {
      newSelectedIds.add(employeeId);
    } else {
      newSelectedIds.delete(employeeId);
    }
    setSelectedEmployeeIds(newSelectedIds);
  };

  const handleDeleteSelected = async () => {
    if (!canPerformAdminActions || selectedEmployeeIds.size === 0) {
        toast({ title: "Action Not Allowed", description: "You do not have permission or no employees selected.", variant: "destructive" });
        return;
    }

    setIsDeleting(true);
    let deletedCount = 0;
    let errorMessages: string[] = [];

    for (const id of selectedEmployeeIds) {
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                 const errorBody = await res.json().catch(() => ({ message: `Failed to delete employee ID ${id} (status ${res.status}, non-JSON response)` }));
                 throw new Error(errorBody.error || errorBody.message || `Failed to delete employee ID ${id} (status ${res.status})`);
            }
            deletedCount++;
        } catch (error) {
            errorMessages.push((error as Error).message);
        }
    }
    setIsDeleting(false);

    if (deletedCount > 0) {
       toast({ title: "Employees Deleted", description: `${deletedCount} employee(s) removed. ${errorMessages.length > 0 ? `Errors on ${errorMessages.length} items.` : ''}` });
    }
    if (errorMessages.length > 0) {
        toast({ title: "Some Deletions Failed", description: errorMessages.join('; '), variant: "destructive" });
    }
    if (deletedCount === 0 && errorMessages.length === 0){
        toast({ title: "No Employees Deleted", description: "No action was performed.", variant: "default" });
    }

    fetchData();
    setSelectedEmployeeIds(new Set());
  };

  const isAllSelected = filteredAndSortedEmployees.length > 0 && selectedEmployeeIds.size === filteredAndSortedEmployees.length;
  const isIndeterminate = selectedEmployeeIds.size > 0 && selectedEmployeeIds.size < filteredAndSortedEmployees.length;

  if (authIsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Records" description="Manage employee information, performance, and roles."/>
        <Skeleton className="h-10 w-full sm:w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return <div className="flex justify-center items-center h-screen">Unauthorized access. Please log in with appropriate credentials.</div>;
  }
  
  const renderSortIcon = (column: SortableKey) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        description="Manage employee information, performance, and roles."
        actions={
          canPerformAdminActions && (
            <Button onClick={handleAddEmployee} disabled={isSubmittingForm || isLoadingData}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="relative sm:col-span-2 md:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoadingData}
          />
        </div>
         <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={isLoadingData}>
            <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRoleType | "all")} disabled={isLoadingData}>
            <SelectTrigger><SelectValue placeholder="Filter by Role" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES_OPTIONS.map(role => <SelectItem key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
        </Select>
        {canPerformAdminActions && selectedEmployeeIds.size > 0 && (
           <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting || isLoadingData} className="w-full sm:w-auto md:col-start-4">
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
             Delete ({selectedEmployeeIds.size})
           </Button>
        )}
      </div>

      <Card className="shadow-lg rounded-lg overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {canPerformAdminActions && (
                <TableHead className="w-[50px]">
                   <Checkbox
                      checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                      disabled={isLoadingData || !filteredAndSortedEmployees.length}
                    />
                </TableHead>
              )}
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Name {renderSortIcon('name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('email')}>
                 <div className="flex items-center gap-1">Email {renderSortIcon('email')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('department')}>
                 <div className="flex items-center gap-1">Department {renderSortIcon('department')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('position')}>
                 <div className="flex items-center gap-1">Position {renderSortIcon('position')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('role')}>
                 <div className="flex items-center gap-1">Role {renderSortIcon('role')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('supervisorName')}>
                 <div className="flex items-center gap-1">Supervisor {renderSortIcon('supervisorName')}</div>
              </TableHead>
               <TableHead className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleSort('hireDate')}>
                 <div className="flex items-center gap-1">Hire Date {renderSortIcon('hireDate')}</div>
              </TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingData ? (
                Array.from({length:5}).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                        {canPerformAdminActions && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                        <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAndSortedEmployees.length > 0 ? (
              filteredAndSortedEmployees.map((employee) => (
                <TableRow key={employee.id} data-state={selectedEmployeeIds.has(employee.id) ? "selected" : ""}>
                  {canPerformAdminActions && (
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
                      <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} data-ai-hint="person photo"/>
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
                  <TableCell>{format(parseISO(employee.hireDate), "PP")}</TableCell>
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
                        {(canPerformAdminActions || (user?.role === 'SUPERVISOR' && user.id === employee.id)) && (
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {canPerformAdminActions && (
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
                <TableCell colSpan={canPerformAdminActions ? 10 : 9} className="h-24 text-center text-muted-foreground">
                  No employees found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {isFormOpen && (user?.role === 'ADMIN' || (editingEmployee && editingEmployee.id === user?.id)) && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          supervisors={supervisorsForForm}
          canEditAllFields={canPerformAdminActions}
          isSubmitting={isSubmittingForm}
        />
      )}

      {showDeleteConfirm && canPerformAdminActions && employeeToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete employee: <strong>{employeeToDelete?.name}</strong>? This action cannot be undone and may affect related records.
                 {employeeToDelete.role === 'SUPERVISOR' && employeeToDelete.supervisedEmployees && employeeToDelete.supervisedEmployees.length > 0 &&
                    <span className="block mt-2 text-destructive/90">This user supervises {employeeToDelete.supervisedEmployees.length} employee(s). Please reassign them first.</span>
                 }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {viewingEmployee && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={viewingEmployee.avatarUrl || undefined} alt={viewingEmployee.name} data-ai-hint="person photo"/>
                  <AvatarFallback>{viewingEmployee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {viewingEmployee.name}
              </DialogTitle>
              <DialogDescription>
                Detailed information for {viewingEmployee.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Email:</Label>
                <span>{viewingEmployee.email}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Department:</Label>
                <Badge variant="secondary">{viewingEmployee.department}</Badge>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Position:</Label>
                <span>{viewingEmployee.position}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Role:</Label>
                <Badge variant="outline">{viewingEmployee.role.charAt(0) + viewingEmployee.role.slice(1).toLowerCase()}</Badge>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Hire Date:</Label>
                <span>{format(parseISO(viewingEmployee.hireDate), "MMMM d, yyyy")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <Label className="text-muted-foreground font-semibold">Supervisor:</Label>
                <span>{viewingEmployee.supervisor?.name || "N/A"}</span>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
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
