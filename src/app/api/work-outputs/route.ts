
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-outputs - Fetch all work outputs
export async function GET() {
  try {
    const workOutputs = await prisma.workOutput.findMany({
      include: {
        employee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: {
        submissionDate: 'desc',
      }
    });
    return NextResponse.json(workOutputs);
  } catch (dbError: any) {
    console.error("Prisma error fetching work outputs:", dbError);
    return NextResponse.json({ message: 'Database error fetching work outputs.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}

// POST /api/work-outputs - Create a new work output
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, title, description, fileUrl, submissionDate } = data;

    if (!employeeId || !title || !submissionDate) {
      return NextResponse.json({ message: 'Employee ID, title, and submission date are required' }, { status: 400 });
    }

    try {
      const newWorkOutput = await prisma.workOutput.create({
        data: {
          employeeId,
          title,
          description,
          fileUrl,
          submissionDate: new Date(submissionDate),
        },
      });
      return NextResponse.json(newWorkOutput, { status: 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating work output:", dbError);
      if (dbError.code === 'P2003') { 
          return NextResponse.json({ message: 'Invalid employee ID for work output.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error creating work output.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/work-outputs:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for work output creation.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create work output', error: error.message }, { status: 500 });
  }
}
