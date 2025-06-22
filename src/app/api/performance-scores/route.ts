
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRoleType } from '@/types';
import { headers } from 'next/headers';

async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  return null;
}

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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { employeeId, criteriaId, score, comments, evaluationDate, evaluatorId } = data;

    if (!employeeId || !criteriaId || score === undefined || !evaluationDate || !evaluatorId) {
      return NextResponse.json({ message: 'Missing required fields: employeeId, criteriaId, score, evaluationDate, evaluatorId' }, { status: 400 });
    }
    
    if(currentUser.id !== evaluatorId) {
        return NextResponse.json({ message: 'Forbidden: Evaluator ID does not match current user.'}, { status: 403 });
    }

    const parsedScore = parseInt(String(score), 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
        return NextResponse.json({ message: 'Score must be a number between 1 and 5.' }, { status: 400 });
    }

    try {
        const newScore = await prisma.performanceScore.create({
            data: {
                employeeId,
                criteriaId,
                score: parsedScore,
                comments,
                evaluationDate: new Date(evaluationDate), // Ensure it's a Date object
                evaluatorId,
            },
            include: {
                criteria: true
            }
        });

        // Create a notification for the employee who was reviewed
        if (currentUser.id !== employeeId) {
            await prisma.notification.create({
                data: {
                    recipientId: employeeId,
                    actorId: currentUser.id,
                    message: `completed an evaluation for you on "${newScore.criteria.name}".`,
                    link: `/my-evaluations`,
                }
            });
        }

        const { criteria, ...scoreToReturn } = newScore;
        return NextResponse.json(scoreToReturn, { status: 201 });

    } catch (dbError: any) {
        console.error("Prisma error creating performance score:", dbError);
        if (dbError.code === 'P2003') { // Foreign key constraint failed
             return NextResponse.json({ message: 'Invalid employee, criteria, or evaluator ID provided.' }, { status: 400 });
        }
         return NextResponse.json({ message: 'Database error creating performance score.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
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
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
