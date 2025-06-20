
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
import { mockEvaluationCriteria, mockPerformanceScores, mockEmployees, mockSupervisors } from "@/lib/mockData";
import type { EvaluationCriteria, PerformanceScore } from "@/types";
import { PlusCircle, Edit, Trash2, Eye, ListChecks, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function EvaluationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [criteria, setCriteria] = React.useState<EvaluationCriteria[]>(mockEvaluationCriteria);
  const [scores, setScores] = React.useState<PerformanceScore[]>(mockPerformanceScores);

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'supervisor') {
      router.push('/login'); // Or an unauthorized page
    }
  }, [user, isLoading, router]);


  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find(emp => emp.id === employeeId)?.name || "Unknown Employee";
  };
  
  const getCriteriaName = (criteriaId: string) => {
    return criteria.find(c => c.id === criteriaId)?.name || "Unknown Criteria";
  };

  const getEvaluatorName = (evaluatorId: string) => {
    return mockSupervisors.find(sup => sup.id === evaluatorId)?.name || mockEmployees.find(emp => emp.id === evaluatorId)?.name || "Unknown Evaluator";
  }

  const filteredScores = React.useMemo(() => {
    if (user?.role === 'supervisor') {
      // Supervisors see scores of employees they supervise, or scores they evaluated
      const supervisedEmployeeIds = mockEmployees.filter(emp => emp.supervisorId === user.id).map(emp => emp.id);
      return scores.filter(score => supervisedEmployeeIds.includes(score.employeeId) || score.evaluatorId === user.id);
    }
    return scores; // Admin sees all
  }, [scores, user]);


  if (isLoading || !user || (user.role !== 'admin' && user.role !== 'supervisor')) {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const canPerformWriteActions = user.role === 'admin'; // Supervisors can only view for now, or conduct new ones

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
                  <Button onClick={() => toast({ title: "Coming Soon", description: "Add new criterion functionality will be available soon."})}>
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
                  {criteria.length > 0 ? criteria.map((criterion) => (
                    <TableRow key={criterion.id}>
                      <TableCell className="font-medium">{criterion.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{criterion.description}</TableCell>
                      <TableCell className="text-center">{criterion.weight ? `${criterion.weight * 100}%` : "N/A"}</TableCell>
                      {canPerformWriteActions && (
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" onClick={() => toast({ title: "Coming Soon", description: "Edit criterion functionality will be available soon."})}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => toast({ title: "Coming Soon", description: "Delete criterion functionality will be available soon."})}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
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
                {/* Supervisors should be able to start new reviews for their team */}
                {(user.role === 'admin' || user.role === 'supervisor') && (
                  <Button onClick={() => toast({ title: "Coming Soon", description: "Start new review functionality will be available soon."})}>
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
                      <TableCell>{new Date(score.evaluationDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline">{getCriteriaName(score.criteriaId)}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant={score.score >= 4 ? "default" : score.score === 3 ? "secondary" : "destructive"}>
                          {score.score}/5
                        </Badge>
                      </TableCell>
                      <TableCell>{getEvaluatorName(score.evaluatorId)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => toast({ title: "Coming Soon", description: "View review details functionality will be available soon."})}>
                          <Eye className="h-4 w-4" />
                           <span className="sr-only">View</span>
                        </Button>
                         {/* Admin can delete, or supervisor if they conducted it */}
                         {(user.role === 'admin' || (user.role === 'supervisor' && score.evaluatorId === user.id)) && (
                            <Button variant="destructive" size="icon" onClick={() => toast({ title: "Coming Soon", description: "Delete review functionality will be available soon."})}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
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
    </div>
  );
}
