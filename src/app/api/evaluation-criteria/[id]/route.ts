
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  id: string;
}

// GET /api/evaluation-criteria/[id] - Fetch a single criterion
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Criterion ID is required.' }, { status: 400 });
    }
    try {
      const criterion = await prisma.evaluationCriteria.findUnique({
        where: { id },
      });
      if (!criterion) {
        return NextResponse.json({ message: 'Evaluation criterion not found' }, { status: 404 });
      }
      return NextResponse.json(criterion);
    } catch (dbError: any) {
      console.error(`Prisma error fetching criterion ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching criterion.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/evaluation-criteria/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch criterion', error: error.message }, { status: 500 });
  }
}


// PUT /api/evaluation-criteria/[id] - Update evaluation criteria
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Criterion ID is required for update.' }, { status: 400 });
    }
    const data = await request.json();
    const { name, description, weight } = data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    if (weight !== undefined) {
        if (weight === null || String(weight).trim() === "") {
            updateData.weight = null;
        } else {
            const numWeight = parseFloat(String(weight));
            if (!isNaN(numWeight)) {
                updateData.weight = numWeight;
            } else {
                 return NextResponse.json({ message: 'Invalid weight value. Must be a number or null.' }, { status: 400 });
            }
        }
    }


    try {
      const updatedCriteria = await prisma.evaluationCriteria.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedCriteria);
    } catch (dbError: any) {
      console.error(`Prisma error updating evaluation criteria ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Evaluation criterion not found for update.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error updating criterion.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in PUT /api/evaluation-criteria/[id] for id ${params?.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for criterion update.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update evaluation criteria', error: error.message }, { status: 500 });
  }
}

// DELETE /api/evaluation-criteria/[id] - Delete evaluation criteria
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Criterion ID is required for deletion.' }, { status: 400 });
    }
    try {
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
    } catch (dbError: any) {
      console.error(`Prisma error deleting evaluation criteria ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Evaluation criterion not found for deletion.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting criterion.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/evaluation-criteria/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete evaluation criteria', error: error.message }, { status: 500 });
  }
}

    