
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { headers } from 'next/headers';
import type { UserRoleType, AuditActionType } from '@/types';

const SALT_ROUNDS = 10;

interface Params {
  id: string;
}

// Helper function to get current user from custom headers
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  return null;
}

// POST /api/users/[id]/change-password
export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    
    // Ensure user can only change their own password
    if (currentUser.id !== params.id) {
        return NextResponse.json({ message: 'Forbidden: You can only change your own password.' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ message: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'User not found or password not set.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
       await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "AUTH_PASSWORD_CHANGE_FAILURE" as AuditActionType,
                details: JSON.stringify({ reason: "Incorrect current password" }),
            },
        });
      return NextResponse.json({ message: 'Incorrect current password.' }, { status: 403 });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: params.id },
      data: { password: newHashedPassword },
    });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "AUTH_PASSWORD_CHANGE_SUCCESS" as AuditActionType,
        },
    });

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error("Error changing password:", error);
    let status = 500;
    let message = 'Failed to change password due to a server error.';
    if (error instanceof SyntaxError) {
        status = 400;
        message = 'Invalid JSON payload for password change.';
    }
    return NextResponse.json({ message, error: error.message }, { status });
  }
}
