
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/performance-scores/[id] - Fetch a single performance score by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
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
  } catch (error) {
    console.error(`Error fetching performance score ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch performance score', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/performance-scores/[id] - Delete a performance score by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    await prisma.performanceScore.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Performance score deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting performance score ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Performance score not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete performance score', error: (error as Error).message }, { status: 500 });
  }
}
