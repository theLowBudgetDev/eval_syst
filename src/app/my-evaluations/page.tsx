
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { mockPerformanceScores, mockEvaluationCriteria, mockSupervisors } from "@/lib/mockData";
import type { PerformanceScore } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function MyEvaluationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [myScores, setMyScores] = React.useState<PerformanceScore[]>([]);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      setMyScores(mockPerformanceScores.filter(score => score.employeeId === user.id));
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading evaluations...</div>;
  }
  
  const getCriteriaName = (criteriaId: string) => {
    return mockEvaluationCriteria.find(c => c.id === criteriaId)?.name || "Unknown Criteria";
  };

  const getEvaluatorName = (evaluatorId: string) => {
    return mockSupervisors.find(s => s.id === evaluatorId)?.name || "Unknown Evaluator";
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="My Performance Evaluations"
        description="Review your past performance assessments and feedback."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
          <CardDescription>
            A log of all your performance reviews conducted on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myScores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluation Date</TableHead>
                  <TableHead>Criteria Assessed</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myScores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell>{new Date(score.evaluationDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{getCriteriaName(score.criteriaId)}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge variant={score.score >= 4 ? "default" : score.score === 3 ? "secondary" : "destructive"}>
                        {score.score}/5
                      </Badge>
                    </TableCell>
                    <TableCell>{getEvaluatorName(score.evaluatorId)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" onClick={() => toast({title: "Details", description: score.comments || "No comments provided."})}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You do not have any evaluation records yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
