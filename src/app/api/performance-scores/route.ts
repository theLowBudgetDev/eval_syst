
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
  } catch (error) {
    console.error("Error fetching performance scores:", error);
    return NextResponse.json({ message: 'Failed to fetch performance scores', error: (error as Error).message }, { status: 500 });
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
  } catch (error) {
    console.error("Error creating performance score:", error);
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: 'Invalid employee, criteria, or evaluator ID' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create performance score', error: (error as Error).message }, { status: 500 });
  }
}
