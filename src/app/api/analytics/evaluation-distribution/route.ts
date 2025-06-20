
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { EvaluationDistributionPoint } from '@/types';

export async function GET() {
  try {
    const scores = await prisma.performanceScore.findMany({
      select: {
        score: true,
      },
    });

    if (scores.length === 0) {
      return NextResponse.json([]);
    }

    const distribution: { [category: string]: number } = {
      "Outstanding": 0,       // Score 5
      "Exceeds Expectations": 0, // Score 4
      "Meets Expectations": 0,   // Score 3
      "Below Expectations": 0,   // Score 1-2
    };

    scores.forEach(s => {
      if (s.score === 5) {
        distribution["Outstanding"]++;
      } else if (s.score === 4) {
        distribution["Exceeds Expectations"]++;
      } else if (s.score === 3) {
        distribution["Meets Expectations"]++;
      } else if (s.score <= 2 && s.score >=1) { // Assuming scores are 1-5
        distribution["Below Expectations"]++;
      }
    });

    const distributionData: EvaluationDistributionPoint[] = Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json(distributionData);

  } catch (error: any) {
    console.error("Error fetching evaluation distribution:", error);
    return NextResponse.json(
      { message: "Failed to fetch evaluation distribution", error: error.message, code: error.code },
      { status: 500 }
    );
  }
}
