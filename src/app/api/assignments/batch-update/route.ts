
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

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { employeeIds, supervisorId } = await request.json();

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ message: 'Employee IDs must be a non-empty array.' }, { status: 400 });
    }
    if (supervisorId !== null && typeof supervisorId !== 'string') {
        return NextResponse.json({ message: 'Supervisor ID must be a string or null.' }, { status: 400 });
    }

    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: employeeIds,
        },
      },
      data: {
        supervisorId: supervisorId,
      },
    });

    await prisma.auditLog.create({
        data: {
            userId: currentUser.id,
            action: "BATCH_ASSIGNMENT_SUCCESS" as AuditActionType,
            details: JSON.stringify({
                count: result.count,
                employeeIds: employeeIds,
                newSupervisorId: supervisorId
            })
        }
    });

    return NextResponse.json({ message: `Successfully updated ${result.count} employees.` });

  } catch (error: any) {
    console.error("Error in batch assignment:", error);
    try {
        await prisma.auditLog.create({
            data: {
                userId: currentUser.id,
                action: "BATCH_ASSIGNMENT_FAILURE" as AuditActionType,
                details: JSON.stringify({ error: error.message })
            }
        });
    } catch (auditError) {
        console.error("Failed to log batch assignment failure:", auditError);
    }

    if (error.code === 'P2003') {
        return NextResponse.json({ message: 'Invalid supervisor ID provided.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Failed to perform batch assignment', error: error.message }, { status: 500 });
  }
}
