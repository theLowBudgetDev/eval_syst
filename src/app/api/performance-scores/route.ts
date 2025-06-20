
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/performance-scores - Fetch all performance scores
export async function GET() {
  try {
    const scores = await prisma.performanceScore.findMany({
      include: {
        employee: { select: { id: true, name: true, avatarUrl: true } },
        criteria: { select: { id: true, name: true } },
        evaluator: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: {
        evaluationDate: 'desc',
      }
    });
    return NextResponse.json(scores);
  } catch (dbError: any) {
    console.error("Prisma error fetching performance scores:", dbError);
    return NextResponse.json({ message: 'Database error fetching performance scores.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}

// POST /api/performance-scores - Create a new performance score
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, criteriaId, score, comments, evaluationDate, evaluatorId } = data;

    if (!employeeId || !criteriaId || !score || !evaluationDate || !evaluatorId) {
      return NextResponse.json({ message: 'Missing required fields for performance score' }, { status: 400 });
    }

    try {
      const newScore = await prisma.performanceScore.create({
        data: {
          employeeId,
          criteriaId,
          score: parseInt(score, 10),
          comments,
          evaluationDate: new Date(evaluationDate),
          evaluatorId,
        },
      });
      return NextResponse.json(newScore, { status: 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating performance score:", dbError);
      if (dbError.code === 'P2003') { 
          return NextResponse.json({ message: 'Invalid employee, criteria, or evaluator ID for performance score.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error creating performance score.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/performance-scores:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for performance score creation.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create performance score', error: error.message }, { status: 500 });
  }
}
