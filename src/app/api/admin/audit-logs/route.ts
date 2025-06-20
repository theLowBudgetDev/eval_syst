
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType } from '@/types';

// Helper function to get current user (placeholder - replace with your actual auth logic)
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole === 'ADMIN') { // Only ADMIN can access audit logs
    return { id: userId, role: userRole };
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view audit logs.' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 100, // Limit to recent 100 logs for performance in this basic version
    });

    return NextResponse.json(auditLogs);
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ message: 'Failed to fetch audit logs', error: error.message }, { status: 500 });
  }
}
