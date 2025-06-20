
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/evaluation-criteria/[id] - Fetch a single criterion
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const criterion = await prisma.evaluationCriteria.findUnique({
      where: { id },
    });
    if (!criterion) {
      return NextResponse.json({ message: 'Evaluation criterion not found' }, { status: 404 });
    }
    return NextResponse.json(criterion);
  } catch (error) {
    console.error(`Error fetching criterion ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch criterion', error: (error as Error).message }, { status: 500 });
  }
}


// PUT /api/evaluation-criteria/[id] - Update evaluation criteria
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const data = await request.json();
    const { name, description, weight } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;


    const updatedCriteria = await prisma.evaluationCriteria.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedCriteria);
  } catch (error) {
    console.error(`Error updating evaluation criteria ${id}:`, error);
     if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Evaluation criterion not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update evaluation criteria', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/evaluation-criteria/[id] - Delete evaluation criteria
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    // Before deleting a criterion, ensure it's not used in performance scores
    // Or handle this by cascading delete / setting to null in schema / app logic
    const scoresUsingCriteria = await prisma.performanceScore.count({
        where: { criteriaId: id }
    });

    if (scoresUsingCriteria > 0) {
        return NextResponse.json({ message: 'Cannot delete criterion, it is used in performance scores. Please remove scores first or reassign criteria.' }, { status: 409 });
    }

    await prisma.evaluationCriteria.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Evaluation criteria deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting evaluation criteria ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Evaluation criterion not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete evaluation criteria', error: (error as Error).message }, { status: 500 });
  }
}
