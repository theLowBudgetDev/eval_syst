
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { PlusCircle, Edit, Trash2, Eye, ListChecks, Star, Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";


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
  evaluationDate: string; // YYYY-MM-DD
}


export default function EvaluationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [criteria, setCriteria] = React.useState<EvaluationCriteria[]>([]);
  const [scores, setScores] = React.useState<PerformanceScore[]>([]);
  const [employees, setEmployees] = React.useState<AppUser[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [isCriteriaFormOpen, setIsCriteriaFormOpen] = React.useState(false);
  const [editingCriteria, setEditingCriteria] = React.useState<EvaluationCriteria | null>(null);
  const [criteriaFormData, setCriteriaFormData] = React.useState<CriteriaFormData>({ name: '', description: '', weight: null });
  const [isSubmittingCriteria, setIsSubmittingCriteria] = React.useState(false);

  const [isReviewFormOpen, setIsReviewFormOpen] = React.useState(false);
  const [reviewFormData, setReviewFormData] = React.useState<ReviewFormData>({ employeeId: '', criteriaId: '', score: 3, evaluationDate: format(new Date(), 'yyyy-MM-dd'), comments: '' });
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'criteria' | 'score', name?: string} | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const [isReviewDetailOpen, setIsReviewDetailOpen] = React.useState(false);
  const [viewingScore, setViewingScore] = React.useState<PerformanceScore | null>(null);

  const getScoreBadgeVariant = (scoreValue: number) => {
    if (scoreValue >= 4) return "default";
    if (scoreValue === 3) return "secondary";
    return "destructive";
  };
  
  const handleOpenReviewDetailDialog = (score: PerformanceScore) => {
    setViewingScore(score);
    setIsReviewDetailOpen(true);
  };

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [criteriaRes, scoresRes, employeesRes] = await Promise.all([
        fetch("/api/evaluation-criteria"),
        fetch("/api/performance-scores"),
        fetch("/api/users"),
      ]);

      if (!criteriaRes.ok) {
        const errorBody = await criteriaRes.json().catch(() => ({ message: `Failed to fetch criteria (status ${criteriaRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch criteria (status ${criteriaRes.status})`);
      }
      setCriteria(await criteriaRes.json());

      if (!scoresRes.ok) {
        const errorBody = await scoresRes.json().catch(() => ({ message: `Failed to fetch scores (status ${scoresRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch scores (status ${scoresRes.status})`);
      }
      setScores(await scoresRes.json());

      if (!employeesRes.ok) {
        const errorBody = await employeesRes.json().catch(() => ({ message: `Failed to fetch employees (status ${employeesRes.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch employees (status ${employeesRes.status})`);
      }
      setEmployees(await employeesRes.json());

    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
      setCriteria([]); setScores([]); setEmployees([]);
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
  const getEvaluatorName = (evaluatorId: string | null) => evaluatorId ? (employees.find(emp => emp.id === evaluatorId)?.name || "Unknown") : "N/A";


  const filteredScores = React.useMemo(() => {
    if (user?.role === 'SUPERVISOR') {
      const supervisedEmployeeIds = employees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id);
      // Supervisor sees scores for their team members OR scores they conducted for anyone (e.g. peer review)
      return scores.filter(score => supervisedEmployeeIds.includes(score.employeeId) || score.evaluatorId === user.id);
    }
    return scores; // Admin sees all
  }, [scores, user, employees]);


  const canPerformWriteActions = user?.role === 'ADMIN';

  const handleOpenCriteriaForm = (crit: EvaluationCriteria | null = null) => {
    if (!canPerformWriteActions && crit) {
      toast({ title: "Permission Denied", description: "Only administrators can edit global evaluation criteria.", variant: "destructive"});
      return;
    }
    if (!canPerformWriteActions && !crit) {
      toast({ title: "Permission Denied", description: "Only administrators can add new evaluation criteria.", variant: "destructive"});
      return;
    }
    if (crit) {
      setEditingCriteria(crit);
      setCriteriaFormData({ name: crit.name, description: crit.description, weight: crit.weight === undefined || crit.weight === null ? null : Number(crit.weight) });
    } else {
      setEditingCriteria(null);
      setCriteriaFormData({ name: '', description: '', weight: null });
    }
    setIsCriteriaFormOpen(true);
  };

  const handleCriteriaFormSubmit = async () => {
    if (!canPerformWriteActions) return;
    setIsSubmittingCriteria(true);
    const method = editingCriteria ? 'PUT' : 'POST';
    const url = editingCriteria ? `/api/evaluation-criteria/${editingCriteria.id}` : '/api/evaluation-criteria';
    
    let weightValue: number | null = null;
    if (criteriaFormData.weight !== undefined && criteriaFormData.weight !== null && criteriaFormData.weight !== "") {
        const parsedWeight = parseFloat(String(criteriaFormData.weight));
        if (!isNaN(parsedWeight)) {
            weightValue = parsedWeight;
        } else {
            toast({ title: "Invalid Input", description: "Weight must be a valid number.", variant: "destructive" });
            setIsSubmittingCriteria(false);
            return;
        }
    }
    const payload = { ...criteriaFormData, weight: weightValue };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to save criteria (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to save criteria (status ${res.status})`);
      }
      toast({ title: `Criteria ${editingCriteria ? 'Updated' : 'Added'}` });
      fetchData();
      setIsCriteriaFormOpen(false);
    } catch (error) {
      toast({ title: "Error Saving Criteria", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingCriteria(false);
    }
  };

  const handleDeleteRequest = (id: string, type: 'criteria' | 'score', name?: string) => {
    if (type === 'criteria' && !canPerformWriteActions) {
       toast({ title: "Permission Denied", description: "Only administrators can delete criteria.", variant: "destructive"});
       return;
    }
    const scoreItem = type === 'score' ? scores.find(s => s.id === id) : null;
    if (type === 'score' && scoreItem && !canPerformWriteActions && scoreItem.evaluatorId !== user?.id) {
       toast({ title: "Permission Denied", description: "You can only delete reviews you conducted.", variant: "destructive"});
       return;
    }
    setItemToDelete({ id, type, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const { id, type } = itemToDelete;
    const url = type === 'criteria' ? `/api/evaluation-criteria/${id}` : `/api/performance-scores/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to delete ${type} (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to delete ${type} (status ${res.status})`);
      }
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted` });
      fetchData();
    } catch (error) {
      toast({ title: `Error Deleting ${type}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleOpenReviewForm = () => {
    setReviewFormData({ employeeId: '', criteriaId: '', score: 3, evaluationDate: format(new Date(), 'yyyy-MM-dd'), comments: '' });
    setIsReviewFormOpen(true);
  };

  const handleReviewFormSubmit = async () => {
    if (!user) return;
    if (!reviewFormData.employeeId || !reviewFormData.criteriaId) {
        toast({ title: "Missing Fields", description: "Please select an employee and criteria.", variant: "destructive" });
        return;
    }
    setIsSubmittingReview(true);
    
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('X-User-Id', user.id);
    headers.append('X-User-Role', user.role);

    const payload = {
      ...reviewFormData,
      score: Number(reviewFormData.score), // Ensure score is number
      evaluatorId: user.id,
      evaluationDate: new Date(reviewFormData.evaluationDate).toISOString() // Ensure ISO string
    };
    try {
      const res = await fetch('/api/performance-scores', { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to save review (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to save review (status ${res.status})`);
      }
      toast({ title: "Review Added" });
      fetchData();
      setIsReviewFormOpen(false);
    } catch (error) {
      toast({ title: "Error Saving Review", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const employeesForSupervisorReview = user?.role === 'SUPERVISOR'
    ? employees.filter(e => e.supervisorId === user.id)
    : employees; // Admin sees all applicable employees

  if (authIsLoading || isLoadingData || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return (
      <div className="space-y-6">
        <PageHeader title="Evaluations Management" description="Define evaluation criteria and manage performance reviews."/>
        <Skeleton className="h-10 w-full md:w-[400px]" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

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
          <Card className="shadow-lg border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <CardTitle>Evaluation Criteria</CardTitle>
                    <CardDescription>Manage the criteria used for employee evaluations.</CardDescription>
                </div>
                {canPerformWriteActions && (
                  <Button onClick={() => handleOpenCriteriaForm()} disabled={isSubmittingCriteria || isLoadingData}>
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
                          <Button variant="outline" size="icon" onClick={() => handleOpenCriteriaForm(crit)} disabled={isSubmittingCriteria || isDeleting}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(crit.id, 'criteria', crit.name)} disabled={isDeleting || isSubmittingCriteria}>
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
          <Card className="shadow-lg border-border">
            <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <CardTitle>Performance Reviews</CardTitle>
                    <CardDescription>View and manage employee performance reviews.</CardDescription>
                </div>
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                  <Button onClick={() => handleOpenReviewForm()} disabled={isSubmittingReview || isLoadingData}>
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
                      <TableCell>{format(parseISO(score.evaluationDate), "PP")}</TableCell>
                      <TableCell><Badge variant="outline">{getCriteriaName(score.criteriaId)}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant={score.score >= 4 ? "default" : score.score === 3 ? "secondary" : "destructive"}>
                          {score.score}/5
                        </Badge>
                      </TableCell>
                      <TableCell>{getEvaluatorName(score.evaluatorId)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenReviewDetailDialog(score)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                         {(user.role === 'ADMIN' || (user.role === 'SUPERVISOR' && score.evaluatorId === user.id)) && (
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(score.id, 'score', `${getEmployeeName(score.employeeId)} on ${format(parseISO(score.evaluationDate), "PP")}`)} disabled={isDeleting || isSubmittingReview}>
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
                <Input id="crit-name" value={criteriaFormData.name} onChange={e => setCriteriaFormData({...criteriaFormData, name: e.target.value})} disabled={isSubmittingCriteria}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="crit-desc">Description</Label>
                <Textarea id="crit-desc" value={criteriaFormData.description} onChange={e => setCriteriaFormData({...criteriaFormData, description: e.target.value})} disabled={isSubmittingCriteria}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="crit-weight">Weight (0.0 to 1.0, e.g., 0.2 for 20%)</Label>
                <Input 
                    id="crit-weight" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="1" 
                    value={criteriaFormData.weight === null || criteriaFormData.weight === undefined ? "" : criteriaFormData.weight} 
                    onChange={e => setCriteriaFormData({...criteriaFormData, weight: e.target.value === "" ? null : parseFloat(e.target.value)})} 
                    disabled={isSubmittingCriteria}
                    placeholder="e.g., 0.25"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCriteriaFormOpen(false)} disabled={isSubmittingCriteria}>Cancel</Button>
              <Button onClick={handleCriteriaFormSubmit} disabled={isSubmittingCriteria}>
                {isSubmittingCriteria && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Criterion
              </Button>
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
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                    <Label htmlFor="rev-employee">Employee</Label>
                    <Select
                        value={reviewFormData.employeeId}
                        onValueChange={val => setReviewFormData({...reviewFormData, employeeId: val})}
                        disabled={isSubmittingReview}
                    >
                        <SelectTrigger id="rev-employee"><SelectValue placeholder="Select Employee"/></SelectTrigger>
                        <SelectContent>
                            {employeesForSupervisorReview.filter(e => e.role === 'EMPLOYEE' || e.role === 'SUPERVISOR').map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="rev-criteria">Criteria</Label>
                     <Select
                        value={reviewFormData.criteriaId}
                        onValueChange={val => setReviewFormData({...reviewFormData, criteriaId: val})}
                        disabled={isSubmittingReview}
                    >
                        <SelectTrigger id="rev-criteria"><SelectValue placeholder="Select Criteria"/></SelectTrigger>
                        <SelectContent>
                            {criteria.map(crit => <SelectItem key={crit.id} value={crit.id}>{crit.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rev-score">Score (1-5)</Label>
                    <Input id="rev-score" type="number" min="1" max="5" value={reviewFormData.score} onChange={e => setReviewFormData({...reviewFormData, score: parseInt(e.target.value)})} disabled={isSubmittingReview}/>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="rev-date">Evaluation Date</Label>
                    <Input id="rev-date" type="date" value={reviewFormData.evaluationDate} onChange={e => setReviewFormData({...reviewFormData, evaluationDate: e.target.value})} disabled={isSubmittingReview}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rev-comments">Comments</Label>
                    <Textarea id="rev-comments" value={reviewFormData.comments} onChange={e => setReviewFormData({...reviewFormData, comments: e.target.value})} disabled={isSubmittingReview}/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewFormOpen(false)} disabled={isSubmittingReview}>Cancel</Button>
                <Button onClick={handleReviewFormSubmit} disabled={isSubmittingReview}>
                    {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Review
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}: <strong>{itemToDelete?.name || itemToDelete?.id}</strong>? This action cannot be undone.
              {itemToDelete?.type === 'criteria' && <span className="block mt-2 text-destructive/90">Deleting criteria may affect existing performance scores linked to it.</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isReviewDetailOpen} onOpenChange={setIsReviewDetailOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                    Evaluation for <strong>{viewingScore?.employee?.name || getEmployeeName(viewingScore?.employeeId || '')}</strong> conducted on {viewingScore ? format(parseISO(viewingScore.evaluationDate), "PP") : ''}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label className="text-muted-foreground">Evaluator</Label>
                    <span>{viewingScore?.evaluator?.name || getEvaluatorName(viewingScore?.evaluatorId || '')}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label className="text-muted-foreground">Criteria</Label>
                    <Badge variant="secondary">{viewingScore?.criteria?.name || getCriteriaName(viewingScore?.criteriaId || '')}</Badge>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label className="text-muted-foreground">Score</Label>
                     <Badge variant={viewingScore ? getScoreBadgeVariant(viewingScore.score) : 'outline'}>{viewingScore?.score}/5</Badge>
                </div>
                 <Separator />
                <div>
                    <Label className="text-muted-foreground">Comments</Label>
                    <p className="mt-1 text-card-foreground bg-muted/50 p-3 rounded-md min-h-[60px]">
                        {viewingScore?.comments || "No comments provided."}
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewDetailOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
