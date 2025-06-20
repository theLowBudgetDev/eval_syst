
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Goal, GoalStatusType, AppUser } from "@/types";
import { PlusCircle, Edit, Trash2, Loader2, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you'll create this or use an existing one

const GOAL_STATUS_OPTIONS: GoalStatusType[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];

interface GoalFormData {
  title: string;
  description?: string;
  status: GoalStatusType;
  dueDate?: Date | null;
  employeeId: string; // Only for Admin/Supervisor when creating for others
}

export default function GoalsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [allUsersForFilter, setAllUsersForFilter] = React.useState<AppUser[]>([]); // For Admin/Supervisor employee filter
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [formData, setFormData] = React.useState<GoalFormData>({
    title: "",
    status: "NOT_STARTED",
    employeeId: user?.id || "", // Default to self, admin/sup can change
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [goalToDelete, setGoalToDelete] = React.useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<GoalStatusType | "all">("all");
  const [employeeFilter, setEmployeeFilter] = React.useState<string>("all"); // 'all' or userId
  const [searchTerm, setSearchTerm] = React.useState("");


  const fetchData = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      // For API calls, provide user ID and role via headers (or adapt your auth mechanism)
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      const goalsRes = await fetch("/api/goals", { headers });
      if (!goalsRes.ok) {
        const errorBody = await goalsRes.json().catch(() => ({ message: `Failed to fetch goals (status ${goalsRes.status})` }));
        throw new Error(errorBody.message || `Failed to fetch goals`);
      }
      setGoals(await goalsRes.json());

      if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
        const usersRes = await fetch("/api/users", { headers }); // Admins/Supervisors might need list of users
        if (!usersRes.ok) throw new Error("Failed to fetch users for filter");
        const usersData: AppUser[] = await usersRes.json();
        if (user.role === 'SUPERVISOR') {
            setAllUsersForFilter(usersData.filter(u => u.supervisorId === user.id || u.id === user.id));
        } else {
            setAllUsersForFilter(usersData);
        }
      }

    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
      if (!formData.employeeId && user.role === 'EMPLOYEE') {
        setFormData(prev => ({ ...prev, employeeId: user.id }));
      }
    }
  }, [user, authIsLoading, router, fetchData, formData.employeeId]);


  const handleOpenForm = (goal: Goal | null = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        description: goal.description || "",
        status: goal.status,
        dueDate: goal.dueDate ? parseISO(goal.dueDate) : null,
        employeeId: goal.employeeId,
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: "",
        description: "",
        status: "NOT_STARTED",
        dueDate: null,
        employeeId: user?.id || "", // Default to self if not admin/sup picking
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!user) return;
    if (!formData.title || !formData.status) {
      toast({ title: "Missing Fields", description: "Title and status are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const headers = new Headers();
    headers.append('X-User-Id', user.id);
    headers.append('X-User-Role', user.role);
    headers.append('Content-Type', 'application/json');

    const payload = {
      ...formData,
      dueDate: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : null, // Format as YYYY-MM-DD for API
      employeeId: (user.role === 'ADMIN' || user.role === 'SUPERVISOR') ? formData.employeeId : user.id, // Employee can only set for self
    };

    const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
    const method = editingGoal ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to save goal (status ${res.status})` }));
        throw new Error(errorBody.message || `Failed to save goal`);
      }
      toast({ title: `Goal ${editingGoal ? 'Updated' : 'Added'}` });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Error Saving Goal", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete || !user) return;
    setIsDeleting(true);

    const headers = new Headers();
    headers.append('X-User-Id', user.id);
    headers.append('X-User-Role', user.role);
    
    try {
      const res = await fetch(`/api/goals/${goalToDelete.id}`, { method: 'DELETE', headers });
      if (!res.ok) {
         const errorBody = await res.json().catch(() => ({ message: `Failed to delete goal (status ${res.status})` }));
        throw new Error(errorBody.message || `Failed to delete goal`);
      }
      toast({ title: "Goal Deleted" });
      fetchData();
    } catch (error) {
      toast({ title: "Error Deleting Goal", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setGoalToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: GoalStatusType) => {
    switch (status) {
      case 'COMPLETED': return 'default'; // Often green or primary
      case 'IN_PROGRESS': return 'secondary';
      case 'NOT_STARTED': return 'outline';
      case 'ON_HOLD': return 'outline'; // Could be yellow-ish
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };
  
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = searchTerm === "" || 
                          goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
    const matchesEmployee = (user?.role === 'EMPLOYEE' || employeeFilter === "all") || goal.employeeId === employeeFilter;
    return matchesSearch && matchesStatus && matchesEmployee;
  });


  if (authIsLoading || !user) {
    return (
        <div className="space-y-6">
            <PageHeader title="My Goals" description="Set, track, and manage your personal and professional objectives."/>
            <Skeleton className="h-10 w-full md:w-1/3"/>
            <Card><CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === 'EMPLOYEE' ? "My Goals" : "Goal Management"}
        description="Set, track, and manage personal and team objectives."
        actions={
          <Button onClick={() => handleOpenForm()} disabled={isSubmitting || isLoadingData}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
          </Button>
        }
      />
      
      <Card className="shadow-lg border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle>All Goals</CardTitle>
                <CardDescription>
                    {user.role === 'EMPLOYEE' ? 'Your current and past goals.' : 'Goals for yourself and your team members.'}
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                 <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search goals..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as GoalStatusType | "all")}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Status"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {GOAL_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                </Select>
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Employee"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {user.role === 'SUPERVISOR' ? "All My Team & Self" : "All Employees"}
                            </SelectItem>
                            {allUsersForFilter.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-2" />)
          ) : filteredGoals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && <TableHead>Employee</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                        <TableCell>{goal.employee?.name || goal.employeeId}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(goal.status)}>{goal.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{goal.dueDate ? format(parseISO(goal.dueDate), "PP") : "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenForm(goal)} disabled={isSubmitting || isDeleting}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(goal)} disabled={isDeleting || isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
                No goals found matching your criteria. {filteredGoals.length === 0 && goals.length > 0 && "Try adjusting your filters."}
                {goals.length === 0 && "Get started by adding a new goal!"}
            </p>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit" : "Add New"} Goal</DialogTitle>
              <DialogDescription>
                {editingGoal ? "Update the details of this goal." : "Define a new goal for yourself or an employee."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                <div className="space-y-1">
                  <Label htmlFor="goal-employee">Assign to Employee</Label>
                  <Select 
                    value={formData.employeeId} 
                    onValueChange={(value) => setFormData({...formData, employeeId: value})}
                    disabled={isSubmitting || (editingGoal && user.role !== 'ADMIN')} // Only admin can reassign existing goal
                  >
                    <SelectTrigger id="goal-employee">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                       {allUsersForFilter.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="goal-title">Title*</Label>
                <Input id="goal-title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isSubmitting}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="goal-description">Description</Label>
                <Textarea id="goal-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} disabled={isSubmitting}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="goal-status">Status*</Label>
                    <Select value={formData.status} onValueChange={value => setFormData({...formData, status: value as GoalStatusType})} disabled={isSubmitting}>
                        <SelectTrigger id="goal-status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                        <SelectContent>
                            {GOAL_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="goal-duedate">Due Date</Label>
                    {/* Basic date input. For ShadCN DatePicker, you'd import and use it here */}
                    <Input 
                        id="goal-duedate" 
                        type="date" 
                        value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
                        onChange={e => setFormData({...formData, dueDate: e.target.value ? new Date(e.target.value) : null})}
                        disabled={isSubmitting}
                    />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingGoal ? "Save Changes" : "Create Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteConfirm && goalToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the goal: "<strong>{goalToDelete.title}</strong>"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
