
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType, AuditActionType } from '@/types';

async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole === 'ADMIN') {
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

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get('action') as AuditActionType | null;

    const whereClause: any = {};
    if (actionFilter) {
        whereClause.action = actionFilter;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 100,
    });

    return NextResponse.json(auditLogs);
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ message: 'Failed to fetch audit logs', error: error.message }, { status: 500 });
  }
}
