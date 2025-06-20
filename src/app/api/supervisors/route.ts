
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// UserRoleType is not directly used here for Prisma query, as Prisma schema field is String.
// We query for the string 'SUPERVISOR'.

// GET /api/supervisors - Fetch all users with role SUPERVISOR
export async function GET() {
  try {
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR', // Querying for the string value
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
