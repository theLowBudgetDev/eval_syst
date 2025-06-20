
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
import { Badge } from "@/components/ui/badge";
import type { EvaluationCriteria, PerformanceScore, AppUser } from "@/types";
import { PlusCircle, Edit, Trash2, Eye, ListChecks, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";


interface CriteriaFormData {
  name: string;
  description: string;
  weight?: number | null;
}

interface ReviewFormData {
  employeeId: string;
  criteriaId: string;
  score: number;
  comments?: string;
  evaluationDate: string;
}


export default function EvaluationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [criteria, setCriteria] = React.useState<EvaluationCriteria[]>([]);
  const [scores, setScores] = React.useState<PerformanceScore[]>([]);
  const [employees, setEmployees] = React.useState<AppUser[]>([]); // For review form dropdown
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [isCriteriaFormOpen, setIsCriteriaFormOpen] = React.useState(false);
  const [editingCriteria, setEditingCriteria] = React.useState<EvaluationCriteria | null>(null);
  const [criteriaFormData, setCriteriaFormData] = React.useState<CriteriaFormData>({ name: '', description: '', weight: null });

  const [isReviewFormOpen, setIsReviewFormOpen] = React.useState(false);
  const [reviewFormData, setReviewFormData] = React.useState<ReviewFormData>({ employeeId: '', criteriaId: '', score: 3, evaluationDate: format(new Date(), 'yyyy-MM-dd'), comments: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'criteria' | 'score'} | null>(null);


  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [criteriaRes, scoresRes, employeesRes] = await Promise.all([
        fetch("/api/evaluation-criteria"),
        fetch("/api/performance-scores"),
        fetch("/api/users"), // Fetch users for names in scores and form
      ]);

      if (!criteriaRes.ok) throw new Error("Failed to fetch evaluation criteria");
      setCriteria(await criteriaRes.json());

      if (!scoresRes.ok) throw new Error("Failed to fetch performance scores");
      setScores(await scoresRes.json());

      if (!employeesRes.ok) throw new Error("Failed to fetch employees");
      setEmployees(await employeesRes.json());

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


  const getEmployeeName = (employeeId: string) => employees.find(emp => emp.id === employeeId)?.name || "Unknown";
  const getCriteriaName = (criteriaId: string) => criteria.find(c => c.id === criteriaId)?.name || "Unknown";
  const getEvaluatorName = (evaluatorId: string | null) => employees.find(emp => emp.id === evaluatorId)?.name || "Unknown";

  const filteredScores = React.useMemo(() => {
    if (user?.role === 'SUPERVISOR') {
      const supervisedEmployeeIds = employees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id);
      return scores.filter(score => supervisedEmployeeIds.includes(score.employeeId) || score.evaluatorId === user.id);
    }
    return scores; // Admin sees all
  }, [scores, user, employees]);


  if (authIsLoading || isLoadingData || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const canPerformWriteActions = user.role === 'ADMIN';

  // Criteria Handlers
  const handleOpenCriteriaForm = (crit: EvaluationCriteria | null = null) => {
    if (!canPerformWriteActions && crit) return; // Supervisors cannot edit existing global criteria
    if (crit) {
      setEditingCriteria(crit);
      setCriteriaFormData({ name: crit.name, description: crit.description, weight: crit.weight });
    } else {
      setEditingCriteria(null);
      setCriteriaFormData({ name: '', description: '', weight: null });
    }
    setIsCriteriaFormOpen(true);
  };

  const handleCriteriaFormSubmit = async () => {
    if (!canPerformWriteActions) return;
    const method = editingCriteria ? 'PUT' : 'POST';
    const url = editingCriteria ? `/api/evaluation-criteria/${editingCriteria.id}` : '/api/evaluation-criteria';
    const payload = { ...criteriaFormData, weight: criteriaFormData.weight ? Number(criteriaFormData.weight) : null };
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to save criteria'); }
      toast({ title: `Criteria ${editingCriteria ? 'Updated' : 'Added'}` });
      fetchData();
      setIsCriteriaFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleDeleteRequest = (id: string, type: 'criteria' | 'score') => {
    if (type === 'criteria' && !canPerformWriteActions) return;
    if (type === 'score' && !canPerformWriteActions && scores.find(s => s.id === id)?.evaluatorId !== user.id) return;
    setItemToDelete({ id, type });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    const url = type === 'criteria' ? `/api/evaluation-criteria/${id}` : `/api/performance-scores/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || `Failed to delete ${type}`); }
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };
  
  // Review Handlers
  const handleOpenReviewForm = (score: PerformanceScore | null = null) => {
     // Admin can edit any. Supervisor can edit scores they gave.
    if (score && !canPerformWriteActions && score.evaluatorId !== user?.id) {
        toast({ title: "Permission Denied", description: "You can only edit reviews you conducted.", variant: "destructive"});
        return;
    }
    // For now, we are only supporting creating new reviews via the UI. Editing existing scores via form is complex.
    // So, we'll always open form for new review
    setReviewFormData({ employeeId: '', criteriaId: '', score: 3, evaluationDate: format(new Date(), 'yyyy-MM-dd'), comments: '' });
    setIsReviewFormOpen(true);
  };
  
  const handleReviewFormSubmit = async () => {
    if (!user) return;
    const payload = { 
      ...reviewFormData, 
      score: Number(reviewFormData.score), 
      evaluatorId: user.id, 
      evaluationDate: new Date(reviewFormData.evaluationDate).toISOString() 
    };
    try {
      const res = await fetch('/api/performance-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to save review'); }
      toast({ title: "Review Added" });
      fetchData();
      setIsReviewFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const employeesForSupervisor = user.role === 'SUPERVISOR' 
    ? employees.filter(e => e.supervisorId === user.id) 
    : employees;


  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations Management"
        description="Define evaluation criteria and manage performance reviews."
      />

      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="criteria"><ListChecks className="mr-2 h-4 w-4" />Evaluation Criteria</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="mr-2 h-4 w-4" />Performance Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <CardTitle>Evaluation Criteria</CardTitle>
                    <CardDescription>Manage the criteria used for employee evaluations.</CardDescription>
                </div>
                {canPerformWriteActions && (
                  <Button onClick={() => handleOpenCriteriaForm()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Criterion
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px] text-center">Weight</TableHead>
                    {canPerformWriteActions && <TableHead className="text-right w-[150px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria.length > 0 ? criteria.map((crit) => (
                    <TableRow key={crit.id}>
                      <TableCell className="font-medium">{crit.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{crit.description}</TableCell>
                      <TableCell className="text-center">{crit.weight ? `${crit.weight * 100}%` : "N/A"}</TableCell>
                      {canPerformWriteActions && (
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenCriteriaForm(crit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(crit.id, 'criteria')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={canPerformWriteActions ? 4 : 3} className="h-24 text-center">
                        No evaluation criteria defined yet.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <CardTitle>Performance Reviews</CardTitle>
                    <CardDescription>View and manage employee performance reviews.</CardDescription>
                </div>
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                  <Button onClick={() => handleOpenReviewForm()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Start New Review
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Evaluation Date</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Evaluator</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.length > 0 ? filteredScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">{getEmployeeName(score.employeeId)}</TableCell>
                      <TableCell>{format(new Date(score.evaluationDate), "PP")}</TableCell>
                      <TableCell><Badge variant="outline">{getCriteriaName(score.criteriaId)}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant={score.score >= 4 ? "default" : score.score === 3 ? "secondary" : "destructive"}>
                          {score.score}/5
                        </Badge>
                      </TableCell>
                      <TableCell>{getEvaluatorName(score.evaluatorId)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => toast({title: "Review Details", description: score.comments || "No comments for this review."})}>
                          <Eye className="h-4 w-4" />
                        </Button>
                         {(user.role === 'ADMIN' || (user.role === 'SUPERVISOR' && score.evaluatorId === user.id)) && (
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(score.id, 'score')}>
                            <Trash2 className="h-4 w-4" />
                            </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No performance reviews found.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isCriteriaFormOpen && canPerformWriteActions && (
        <Dialog open={isCriteriaFormOpen} onOpenChange={setIsCriteriaFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCriteria ? "Edit" : "Add"} Evaluation Criterion</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="crit-name">Name</Label>
                <Input id="crit-name" value={criteriaFormData.name} onChange={e => setCriteriaFormData({...criteriaFormData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="crit-desc">Description</Label>
                <Textarea id="crit-desc" value={criteriaFormData.description} onChange={e => setCriteriaFormData({...criteriaFormData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="crit-weight">Weight (0.0 to 1.0, e.g., 0.2 for 20%)</Label>
                <Input id="crit-weight" type="number" step="0.01" min="0" max="1" value={criteriaFormData.weight ?? ""} onChange={e => setCriteriaFormData({...criteriaFormData, weight: e.target.value ? parseFloat(e.target.value) : null})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCriteriaFormOpen(false)}>Cancel</Button>
              <Button onClick={handleCriteriaFormSubmit}>Save Criterion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {isReviewFormOpen && (user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
        <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Performance Review</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-1">
                    <Label htmlFor="rev-employee">Employee</Label>
                    <select 
                        id="rev-employee" 
                        value={reviewFormData.employeeId} 
                        onChange={e => setReviewFormData({...reviewFormData, employeeId: e.target.value})}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="" disabled>Select Employee</option>
                        {employeesForSupervisor.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="rev-criteria">Criteria</Label>
                     <select 
                        id="rev-criteria" 
                        value={reviewFormData.criteriaId} 
                        onChange={e => setReviewFormData({...reviewFormData, criteriaId: e.target.value})}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="" disabled>Select Criteria</option>
                        {criteria.map(crit => <option key={crit.id} value={crit.id}>{crit.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rev-score">Score (1-5)</Label>
                    <Input id="rev-score" type="number" min="1" max="5" value={reviewFormData.score} onChange={e => setReviewFormData({...reviewFormData, score: parseInt(e.target.value)})} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="rev-date">Evaluation Date</Label>
                    <Input id="rev-date" type="date" value={reviewFormData.evaluationDate} onChange={e => setReviewFormData({...reviewFormData, evaluationDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rev-comments">Comments</Label>
                    <Textarea id="rev-comments" value={reviewFormData.comments} onChange={e => setReviewFormData({...reviewFormData, comments: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewFormOpen(false)}>Cancel</Button>
                <Button onClick={handleReviewFormSubmit}>Save Review</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteConfirm && itemToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

    