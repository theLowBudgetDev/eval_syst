
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardMetric, PerformanceScore, AppUser, PerformanceTrendPoint, EvaluationDistributionPoint } from "@/types";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Users, ClipboardList, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, Pie, PieChart, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";

const chartConfigPerformance = {
  "Avg Score": {
    label: "Avg Score",
    color: "hsl(var(--primary))",
  },
};

const chartConfigDistribution = {
  employees: {
    label: "Employees",
  },
  "Below Expectations": {
    label: "Below Expectations",
    color: "hsl(var(--destructive))",
  },
  "Meets Expectations": {
    label: "Meets Expectations",
    color: "hsl(var(--chart-3))",
  },
  "Exceeds Expectations": {
    label: "Exceeds Expectations",
    color: "hsl(var(--chart-2))",
  },
  "Outstanding": {
    label: "Outstanding",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export default function DashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [metrics, setMetrics] = React.useState<DashboardMetric[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = React.useState(true);

  const [performanceTrendData, setPerformanceTrendData] = React.useState<PerformanceTrendPoint[]>([]);
  const [evaluationDistributionData, setEvaluationDistributionData] = React.useState<EvaluationDistributionPoint[]>([]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== "ADMIN") {
        if (user.role === "SUPERVISOR") router.push("/supervisor-dashboard");
        else if (user.role === "EMPLOYEE") router.push("/employee-dashboard");
        else router.push("/login");
      } else {
        setIsLoadingData(true);
        setIsLoadingCharts(true);

        Promise.all([
          fetch("/api/users"),
          fetch("/api/performance-scores"),
          fetch("/api/analytics/performance-trends"),
          fetch("/api/analytics/evaluation-distribution"),
        ])
          .then(async ([usersRes, scoresRes, trendsRes, distributionRes]) => {
            if (!usersRes.ok) {
              const errorBody = await usersRes.json().catch(() => ({
                message: `Failed to fetch users (status ${usersRes.status}, non-JSON response)`,
              }));
              throw new Error(
                errorBody.error ||
                  errorBody.message ||
                  `Failed to fetch users (status ${usersRes.status})`
              );
            }
            const usersData: AppUser[] = await usersRes.json();

            if (!scoresRes.ok) {
              const errorBody = await scoresRes.json().catch(() => ({
                message: `Failed to fetch scores (status ${scoresRes.status}, non-JSON response)`,
              }));
              throw new Error(
                errorBody.error ||
                  errorBody.message ||
                  `Failed to fetch scores (status ${scoresRes.status})`
              );
            }
            const scoresData: PerformanceScore[] = await scoresRes.json();

            if (!trendsRes.ok) {
              const errorBody = await trendsRes.json().catch(() => ({
                message: `Failed to fetch performance trends (status ${trendsRes.status}, non-JSON response)`,
              }));
              throw new Error(
                errorBody.error ||
                  errorBody.message ||
                  `Failed to fetch trends (status ${trendsRes.status})`
              );
            }
            setPerformanceTrendData(await trendsRes.json());

            if (!distributionRes.ok) {
              const errorBody = await distributionRes.json().catch(() => ({
                message: `Failed to fetch evaluation distribution (status ${distributionRes.status}, non-JSON response)`,
              }));
              throw new Error(
                errorBody.error ||
                  errorBody.message ||
                  `Failed to fetch distribution (status ${distributionRes.status})`
              );
            }
            setEvaluationDistributionData(await distributionRes.json());

            const totalEmployees = usersData.length;
            const pendingEvaluations = usersData.filter(
              (u) =>
                (u.role === "EMPLOYEE" || u.role === "SUPERVISOR") &&
                !scoresData.some(
                  (s) =>
                    s.employeeId === u.id &&
                    new Date(s.evaluationDate) >
                      new Date(new Date().setMonth(new Date().getMonth() - 3))
                )
            ).length;

            const averageScoreValue =
              scoresData.length > 0
                ? scoresData.reduce((acc, curr) => acc + curr.score, 0) / scoresData.length
                : null;
            const averageScore = averageScoreValue ? `${averageScoreValue.toFixed(1)}/5` : "N/A";

            let trend = 0;
            const previousAverageScore = 4.0;
            if (averageScoreValue !== null) {
              const trendValue =
                ((averageScoreValue - previousAverageScore) / previousAverageScore) * 100;
              trend = Math.round(trendValue * 10) / 10;
            }

            setMetrics([
              {
                title: "Total Employees",
                value: totalEmployees,
                icon: Users,
                trend: 0,
                description: "Active users in system",
              },
              {
                title: "Pending Evaluations",
                value: pendingEvaluations,
                icon: ClipboardList,
                trend: 0,
                description: "Approx. due evaluations",
              },
              {
                title: "Overall Performance",
                value: averageScore,
                icon: TrendingUp,
                trend: trend,
                description: "Avg score vs. last cycle",
              },
              {
                title: "Attendance Issues",
                value: 0,
                icon: AlertTriangle,
                trend: 0,
                description: "This week (mock data)",
              },
            ]);
            setIsLoadingData(false);
            setIsLoadingCharts(false);
          })
          .catch((err) => {
            toast({
              title: "Error Fetching Dashboard Data",
              description: (err as Error).message,
              variant: "destructive",
            });
            setMetrics([
              { title: "Total Employees", value: "N/A", icon: Users },
              { title: "Pending Evaluations", value: "N/A", icon: ClipboardList },
              { title: "Overall Performance", value: "N/A", icon: TrendingUp },
              { title: "Attendance Issues", value: "N/A", icon: AlertTriangle },
            ]);
            setPerformanceTrendData([]);
            setEvaluationDistributionData([]);
            setIsLoadingData(false);
            setIsLoadingCharts(false);
          });
      }
    } else if (!authIsLoading && !user) {
      router.push("/login");
    }
  }, [user, authIsLoading, router, toast]);

  if (authIsLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin Dashboard"
          description="System summary and key performance indicators."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System summary and key performance indicators."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingData || metrics.length === 0
          ? Array(4)
              .fill(0)
              .map((_, i) => <MetricCardSkeleton key={i} />)
          : metrics.map((metric) => (
              <MetricCard key={metric.title} metric={metric} />
            ))}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Average performance scores over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <Skeleton className="h-[300px] w-full" />
            ) : performanceTrendData.length > 0 ? (
              <ChartContainer
                config={chartConfigPerformance}
                className="h-[300px] w-full"
              >
                <LineChart
                  data={performanceTrendData}
                  margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent hideIndicator />}
                  />
                  <Line
                    dataKey="Avg Score"
                    type="monotone"
                    stroke="var(--color-Avg Score)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground h-[300px] flex items-center justify-center">
                No performance trend data available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle>Evaluation Distribution</CardTitle>
            <CardDescription>
              Distribution of employees by performance category based on latest
              scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {isLoadingCharts ? (
              <Skeleton className="h-[300px] w-full max-w-xs" />
            ) : evaluationDistributionData.some((d) => d.value > 0) ? (
              <ChartContainer
                config={chartConfigDistribution}
                className="h-[300px] w-full max-w-xs"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                  />
                  <Pie
                    data={evaluationDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      if (percent === 0) return null;
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--card-foreground))"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs fill-primary-foreground"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {evaluationDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartConfigDistribution[
                            entry.name as keyof typeof chartConfigDistribution
                          ]?.color || "hsl(var(--muted))"
                        }
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground h-[300px] flex items-center justify-center">
                No evaluation distribution data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-5 rounded-sm" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2 mb-1" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon || Users;
  const TrendIcon =
    metric.trend !== undefined && metric.trend > 0
      ? TrendingUp
      : metric.trend !== undefined && metric.trend < 0
      ? TrendingDown
      : Minus;
  const trendColor =
    metric.trend !== undefined && metric.trend > 0
      ? "text-green-600 dark:text-green-400"
      : metric.trend !== undefined && metric.trend < 0
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        {metric.value === "N/A" || metric.value === undefined ? (
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">
          {metric.value === "N/A" || metric.value === undefined ? (
            <Skeleton className="h-9 w-20 inline-block" />
          ) : (
            metric.value
          )}
        </div>
        {metric.description && (
          <p
            className={`text-xs ${
              metric.trend !== undefined ? trendColor : "text-muted-foreground"
            } flex items-center mt-1`}
          >
            {metric.trend !== undefined && (
              <TrendIcon className="h-4 w-4 mr-1" />
            )}
            {metric.trend !== undefined && metric.trend !== 0
              ? `${metric.trend > 0 ? "+" : ""}${metric.trend}%`
              : ""}
            <span
              className={`${
                metric.trend !== undefined && metric.trend !== 0 ? "ml-1" : ""
              } text-muted-foreground`}
            >
              {metric.description}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
