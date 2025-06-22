
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType } from '@/types';

// Helper to check for Admin role
async function isAdmin(): Promise<boolean> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  return !!(userId && userRole === 'ADMIN');
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

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
    
    // Prisma handles Date to ISO string conversion, so no manual serialization is needed for dates.

    return NextResponse.json(backupData);

  } catch (error: any) {
    console.error("Error creating data backup:", error);
    return NextResponse.json({ message: 'Failed to create backup', error: error.message }, { status: 500 });
  }
}
