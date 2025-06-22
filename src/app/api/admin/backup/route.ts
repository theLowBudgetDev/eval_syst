
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType, AuditActionType } from '@/types';
import { format } from 'date-fns';

async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole === 'ADMIN') {
    return { id: userId, role: userRole };
  }
  return null;
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const backupData = {
      users: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true, position: true, hireDate: true, supervisorId: true } }),
      goals: await prisma.goal.findMany(),
      performanceScores: await prisma.performanceScore.findMany(),
      evaluationCriteria: await prisma.evaluationCriteria.findMany(),
      workOutputs: await prisma.workOutput.findMany(),
      attendanceRecords: await prisma.attendanceRecord.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
      autoMessageTriggers: await prisma.autoMessageTrigger.findMany(),
    };
    
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "DATA_BACKUP_SUCCESS" as AuditActionType,
        details: JSON.stringify({ file: `evaltrack_backup_${format(new Date(), "yyyy-MM-dd")}.json` }),
      }
    });

    return NextResponse.json(backupData);

  } catch (error: any) {
    console.error("Error creating data backup:", error);
    try {
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: "DATA_BACKUP_FAILURE" as AuditActionType,
            details: JSON.stringify({ error: error.message }),
          }
        });
    } catch (auditError) {
        console.error("Failed to log backup failure:", auditError);
    }
    return NextResponse.json({ message: 'Failed to create backup', error: error.message }, { status: 500 });
  }
}
