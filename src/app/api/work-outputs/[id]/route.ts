
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/work-outputs/[id] - Fetch a single work output by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const workOutput = await prisma.workOutput.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });
    if (!workOutput) {
      return NextResponse.json({ message: 'Work output not found' }, { status: 404 });
    }
    return NextResponse.json(workOutput);
  } catch (error) {
    console.error(`Error fetching work output ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch work output', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/work-outputs/[id] - Update a work output by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const data = await request.json();
    const { title, description, fileUrl, submissionDate } = data;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (submissionDate) updateData.submissionDate = new Date(submissionDate);
    
    const updatedWorkOutput = await prisma.workOutput.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedWorkOutput);
  } catch (error) {
    console.error(`Error updating work output ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Work output not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update work output', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/work-outputs/[id] - Delete a work output by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    await prisma.workOutput.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Work output deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting work output ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Work output not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete work output', error: (error as Error).message }, { status: 500 });
  }
}
