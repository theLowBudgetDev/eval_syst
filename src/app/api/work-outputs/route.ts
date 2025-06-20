
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
  } catch (error) {
    console.error("Error fetching work outputs:", error);
    return NextResponse.json({ message: 'Failed to fetch work outputs', error: (error as Error).message }, { status: 500 });
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
  } catch (error) {
    console.error("Error creating work output:", error);
    if ((error as any).code === 'P2003') { // Foreign key constraint failed (employeeId)
        return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create work output', error: (error as Error).message }, { status: 500 });
  }
}
