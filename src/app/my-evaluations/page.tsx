
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
import type { PerformanceScore, AppUser, EvaluationCriteria } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyEvaluationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [myScores, setMyScores] = React.useState<PerformanceScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      setIsLoadingData(true);
      fetch(`/api/users/${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch evaluations");
          return res.json();
        })
        .then((userData: AppUser) => {
          setMyScores(userData.performanceScoresReceived || []);
        })
        .catch(err => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
          setMyScores([]);
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [user, authIsLoading, toast]);

  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Performance Evaluations"
          description="Review your past performance assessments and feedback."
        />
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user) {
    return null; // Should be handled by AppContent redirect
  }
  
  const getCriteriaName = (score: PerformanceScore) => {
    return score.criteria?.name || "Unknown Criteria";
  };

  const getEvaluatorName = (score: PerformanceScore) => {
    return score.evaluator?.name || "Unknown Evaluator";
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
          <div className="overflow-x-auto">
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
                      <TableCell>
                        {!isNaN(new Date(score.evaluationDate).getTime())
                          ? format(new Date(score.evaluationDate), "PP")
                          : "Invalid Date"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{getCriteriaName(score)}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant={score.score >= 4 ? "default" : score.score === 3 ? "secondary" : "destructive"}>
                          {score.score}/5
                        </Badge>
                      </TableCell>
                      <TableCell>{getEvaluatorName(score)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => router.push(`/my-evaluations/${score.id}`)}>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
