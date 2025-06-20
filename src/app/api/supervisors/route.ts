
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET /api/supervisors - Fetch all users with role SUPERVISOR
export async function GET() {
  try {
    const supervisors = await prisma.user.findMany({
      where: {
        role: UserRole.SUPERVISOR,
      },
      orderBy: {
        name: 'asc',
      }
    });
    return NextResponse.json(supervisors);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return NextResponse.json({ message: 'Failed to fetch supervisors', error: (error as Error).message }, { status: 500 });
  }
}
