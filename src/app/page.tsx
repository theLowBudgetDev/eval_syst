
"use client"; 

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockDashboardMetrics, mockPerformanceTrendData, mockEvaluationDistributionData } from "@/lib/mockData";
import type { DashboardMetric } from "@/types";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Users, ClipboardList } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, Pie, PieChart, Cell } from "recharts"; // Removed Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer as they are implicitly handled by ChartContainer or not directly used for these specific charts.
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React from "react"; // Ensure React is imported

const chartConfigPerformance = {
  'Avg Score': {
    label: 'Avg Score',
    color: 'hsl(var(--primary))',
  },
};

const chartConfigDistribution = {
  employees: {
    label: "Employees",
  },
  below: {
    label: "Below Expectations",
    color: "hsl(var(--destructive))",
  },
  meets: {
    label: "Meets Expectations",
    color: "hsl(var(--chart-3))",
  },
  exceeds: {
    label: "Exceeds Expectations",
    color: "hsl(var(--chart-2))",
  },
  outstanding: {
    label: "Outstanding",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      // If user is not admin, redirect them from this page
      if (user.role === 'supervisor') router.push('/supervisor-dashboard');
      else if (user.role === 'employee') router.push('/employee-dashboard');
      else router.push('/login'); // Fallback if role is somehow not set
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }


  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System summary and key performance indicators." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockDashboardMetrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Average performance scores over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigPerformance} className="h-[300px] w-full">
              <LineChart data={mockPerformanceTrendData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Line dataKey="Avg Score" type="monotone" stroke="var(--color-Avg Score)" strokeWidth={2} dot={true} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Evaluation Distribution</CardTitle>
            <CardDescription>Distribution of employees by performance category.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={chartConfigDistribution} className="h-[300px] w-full max-w-xs">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} /> {/* Changed from nameKey="value" */}
                <Pie 
                  data={mockEvaluationDistributionData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { // Removed index as it's not used
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-primary-foreground">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {mockEvaluationDistributionData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={
                       entry.name === "Below Expectations" ? chartConfigDistribution.below.color :
                       entry.name === "Meets Expectations" ? chartConfigDistribution.meets.color :
                       entry.name === "Exceeds Expectations" ? chartConfigDistribution.exceeds.color :
                       chartConfigDistribution.outstanding.color
                     } />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ensure MetricCard's Icon prop is correctly typed if it comes from lucide-react or similar
function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon || Users; // Provide a default icon
  const TrendIcon = metric.trend && metric.trend > 0 ? TrendingUp : metric.trend && metric.trend < 0 ? TrendingDown : Minus;
  const trendColor = metric.trend && metric.trend > 0 ? "text-green-600 dark:text-green-400" : metric.trend && metric.trend < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{metric.value}</div>
        {metric.trend !== undefined && (
          <p className={`text-xs ${trendColor} flex items-center mt-1`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            {metric.trend > 0 ? `+${metric.trend}` : metric.trend}%
            {metric.description && <span className="text-muted-foreground ml-1"> {metric.description}</span>}
          </p>
        )}
         {!metric.trend && metric.description && (
           <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
         )}
      </CardContent>
    </Card>
  );
}

// Need to explicitly import these from recharts for LineChart if not implicitly handled by ChartContainer
import { CartesianGrid, XAxis, YAxis } from 'recharts';
