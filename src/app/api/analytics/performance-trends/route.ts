
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

    // Aggregate scores by month for the last 6 months
    const monthlyData: { [month: string]: { totalScore: number; count: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5); // Include current month + 5 past months

    scores.forEach(score => {
      const evalDate = parseISO(score.evaluationDate); // Ensure date is parsed correctly
      if (evalDate >= sixMonthsAgo) {
        const monthName = format(evalDate, 'MMM'); // e.g., "Jan", "Feb"
        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { totalScore: 0, count: 0 };
        }
        monthlyData[monthName].totalScore += score.score;
        monthlyData[monthName].count += 1;
      }
    });

    const trendData: PerformanceTrendPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthName = format(date, 'MMM');
      if (monthlyData[monthName]) {
        trendData.push({
          name: monthName,
          'Avg Score': parseFloat((monthlyData[monthName].totalScore / monthlyData[monthName].count).toFixed(1)),
        });
      } else {
        // Add month with null score if no data, to maintain timeline
        trendData.push({
          name: monthName,
          'Avg Score': null, // Or 0, depending on how you want to display gaps
        });
      }
    }
    
    // Ensure we only return up to 6 points if more months had data from previous years due to 'MMM' format.
    // This simple logic just takes the latest 6 generated points.
    // A more robust solution would sort by actual date if data spanned years.
    // For now, since we process month by month for the last 6, it should be okay.

    return NextResponse.json(trendData);

  } catch (error: any) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { message: "Failed to fetch performance trends", error: error.message, code: error.code },
      { status: 500 }
    );
  }
}
