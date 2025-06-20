
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/performance-scores/[id] - Fetch a single performance score by ID
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Performance score ID is required.' }, { status: 400 });
    }
    try {
      const score = await prisma.performanceScore.findUnique({
        where: { id },
        include: {
          employee: { select: { id: true, name: true } },
          criteria: { select: { id: true, name: true } },
          evaluator: { select: { id: true, name: true } },
        },
      });
      if (!score) {
        return NextResponse.json({ message: 'Performance score not found' }, { status: 404 });
      }
      return NextResponse.json(score);
    } catch (dbError: any) {
      console.error(`Prisma error fetching performance score ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching performance score.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/performance-scores/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch performance score', error: error.message }, { status: 500 });
  }
}

// DELETE /api/performance-scores/[id] - Delete a performance score by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Performance score ID is required for deletion.' }, { status: 400 });
    }
    try {
      await prisma.performanceScore.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Performance score deleted successfully' }, { status: 200 });
    } catch (dbError: any) {
      console.error(`Prisma error deleting performance score ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Performance score not found for deletion.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting performance score.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/performance-scores/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete performance score', error: error.message }, { status: 500 });
  }
}
