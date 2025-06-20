
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/work-outputs/[id] - Fetch a single work output by ID
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work output ID is required.' }, { status: 400 });
    }
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
    } catch (dbError: any) {
      console.error(`Prisma error fetching work output ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching work output.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/work-outputs/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch work output', error: error.message }, { status: 500 });
  }
}

// PUT /api/work-outputs/[id] - Update a work output by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work output ID is required for update.' }, { status: 400 });
    }
    const data = await request.json();
    const { title, description, fileUrl, submissionDate, employeeId /* employeeId might be needed if you allow changing it */ } = data;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (submissionDate) updateData.submissionDate = new Date(submissionDate);
    if (employeeId) updateData.employeeId = employeeId; // If changing employee is allowed
    
    try {
      const updatedWorkOutput = await prisma.workOutput.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedWorkOutput);
    } catch (dbError: any) {
      console.error(`Prisma error updating work output ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Work output not found for update.' }, { status: 404 });
      }
       if (dbError.code === 'P2003' && dbError.meta?.field_name?.includes('employeeId')) { 
          return NextResponse.json({ message: 'Invalid employee ID for work output.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error updating work output.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in PUT /api/work-outputs/[id] for id ${params?.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for work output update.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update work output', error: error.message }, { status: 500 });
  }
}

// DELETE /api/work-outputs/[id] - Delete a work output by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work output ID is required for deletion.' }, { status: 400 });
    }
    try {
      await prisma.workOutput.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Work output deleted successfully' }, { status: 200 });
    } catch (dbError: any) {
      console.error(`Prisma error deleting work output ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Work output not found for deletion.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting work output.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/work-outputs/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete work output', error: error.message }, { status: 500 });
  }
}
