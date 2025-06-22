
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType } from '@/types';

async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // This endpoint will mark all of the user's unread notifications as read.
    // A more advanced version could take an array of IDs from the body.
    await prisma.notification.updateMany({
      where: {
        recipientId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    await prisma.auditLog.create({
        data: {
            userId: currentUser.id,
            action: 'NOTIFICATION_READ',
            details: JSON.stringify({ markedAllAsRead: true })
        }
    });

    return NextResponse.json({ message: "All notifications marked as read." });

  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ message: 'Failed to mark notifications as read', error: error.message }, { status: 500 });
  }
}
