
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

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view notifications.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const noLimit = searchParams.get('no_limit') === 'true';

    const findOptions: any = {
      where: {
        recipientId: currentUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        actor: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    };

    if (!noLimit) {
      findOptions.take = 20; // Default limit for the bell dropdown
    }

    const notifications = await prisma.notification.findMany(findOptions);

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: 'Failed to fetch notifications', error: error.message }, { status: 500 });
  }
}
