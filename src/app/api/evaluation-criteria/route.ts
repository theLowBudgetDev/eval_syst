
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
  } catch (error) {
    console.error("Error fetching evaluation criteria:", error);
    return NextResponse.json({ message: 'Failed to fetch evaluation criteria', error: (error as Error).message }, { status: 500 });
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

    const newCriteria = await prisma.evaluationCriteria.create({
      data: {
        name,
        description,
        weight: weight ? parseFloat(weight) : null,
      },
    });
    return NextResponse.json(newCriteria, { status: 201 });
  } catch (error) {
    console.error("Error creating evaluation criteria:", error);
    return NextResponse.json({ message: 'Failed to create evaluation criteria', error: (error as Error).message }, { status: 500 });
  }
}
