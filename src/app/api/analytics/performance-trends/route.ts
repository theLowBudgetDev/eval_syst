
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, subMonths, parseISO } from 'date-fns';
import type { PerformanceTrendPoint } from '@/types';

export async function GET() {
  try {
    const scores = await prisma.performanceScore.findMany({
      select: {
        score: true,
        evaluationDate: true,
      },
      orderBy: {
        evaluationDate: 'asc',
      },
    });

    if (scores.length === 0) {
      return NextResponse.json([]);
    }

    // Aggregate scores by month using a unique key 'yyyy-MM'
    const monthlyData: { [monthKey: string]: { totalScore: number; count: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5); // Include current month + 5 past months

    scores.forEach(score => {
      const evalDate = score.evaluationDate; // Use the Date object directly from Prisma
      if (evalDate >= sixMonthsAgo) {
        const monthKey = format(evalDate, 'yyyy-MM'); // e.g., "2024-01"
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { totalScore: 0, count: 0 };
        }
        monthlyData[monthKey].totalScore += score.score;
        monthlyData[monthKey].count += 1;
      }
    });

    // Build the final array for the last 6 months in order
    const trendData: PerformanceTrendPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM');
      
      if (monthlyData[monthKey]) {
        trendData.push({
          name: monthName,
          avgScore: parseFloat((monthlyData[monthKey].totalScore / monthlyData[monthKey].count).toFixed(1)),
        });
      } else {
        // Add month with null score if no data, to maintain timeline
        trendData.push({
          name: monthName,
          avgScore: null,
        });
      }
    }
    
    return NextResponse.json(trendData);

  } catch (error: any) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { message: "Failed to fetch performance trends", error: error.message, code: error.code },
      { status: 500 }
    );
  }
}
