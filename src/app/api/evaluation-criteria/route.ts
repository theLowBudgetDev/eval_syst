
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/evaluation-criteria - Fetch all evaluation criteria
export async function GET() {
  try {
    const criteria = await prisma.evaluationCriteria.findMany({
      orderBy: {
        name: 'asc',
      }
    });
    return NextResponse.json(criteria);
  } catch (dbError: any) {
    console.error("Prisma error fetching evaluation criteria:", dbError);
    return NextResponse.json({ message: 'Database error fetching criteria.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}

// POST /api/evaluation-criteria - Create new evaluation criteria
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, weight } = data;

    if (!name || !description) {
      return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
    }

    let parsedWeight: number | null = null;
    if (weight !== undefined && weight !== null && String(weight).trim() !== "") {
        const numWeight = parseFloat(String(weight));
        if (!isNaN(numWeight)) {
            parsedWeight = numWeight;
        } else {
            return NextResponse.json({ message: 'Invalid weight value. Must be a number.' }, { status: 400 });
        }
    }

    try {
      const newCriteria = await prisma.evaluationCriteria.create({
        data: {
          name,
          description,
          weight: parsedWeight,
        },
      });
      return NextResponse.json(newCriteria, { status: 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating evaluation criteria:", dbError);
      return NextResponse.json({ message: 'Database error creating criterion.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/evaluation-criteria:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for criterion creation.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create evaluation criteria', error: error.message }, { status: 500 });
  }
}

    