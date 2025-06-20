
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
  } catch (error: any) {
    console.error("Critical error in GET /api/performance-scores:", error);
    const errorMessage = error.message || 'An unexpected error occurred on the server.';
    const errorCode = error.code;
    return new Response(JSON.stringify({ message: 'Failed to fetch performance scores due to a server error.', error: errorMessage, code: errorCode }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } catch (error: any) {
    console.error("Critical error in POST /api/performance-scores:", error);
    let status = 500;
    const responseBody: { message: string; error?: string; code?: string, details?: any } = {
      message: 'Failed to create performance score due to a server error.',
      error: error.message || 'An unexpected error occurred.',
      code: error.code
    };
    
    if (error instanceof SyntaxError) {
        status = 400;
        responseBody.message = 'Invalid JSON payload for performance score creation.';
    } else if (error.code === 'P2003') { 
        status = 400;
        responseBody.message = 'Invalid employee, criteria, or evaluator ID for performance score.';
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
