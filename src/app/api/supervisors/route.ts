
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
  } catch (dbError: any) {
    console.error("Prisma error fetching supervisors:", dbError);
    return NextResponse.json({ message: 'Database error fetching supervisors.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}
