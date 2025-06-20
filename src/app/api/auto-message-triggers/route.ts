
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { MessageEventType } from '@prisma/client';

// GET /api/auto-message-triggers - Fetch all auto message triggers
export async function GET() {
  try {
    const triggers = await prisma.autoMessageTrigger.findMany({
      orderBy: {
        eventName: 'asc',
      }
    });
    return NextResponse.json(triggers);
  } catch (dbError: any) {
    console.error("Prisma error fetching auto message triggers:", dbError);
    return NextResponse.json({ message: 'Database error fetching triggers.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}

// POST /api/auto-message-triggers - Create a new auto message trigger
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { eventName, messageTemplate, isActive, daysBeforeEvent } = data;

    if (!eventName || !messageTemplate) {
      return NextResponse.json({ message: 'Event name and message template are required' }, { status: 400 });
    }

    try {
      const newTrigger = await prisma.autoMessageTrigger.create({
        data: {
          eventName: eventName as MessageEventType,
          messageTemplate,
          isActive: isActive !== undefined ? isActive : true,
          daysBeforeEvent: daysBeforeEvent ? parseInt(daysBeforeEvent, 10) : null,
        },
      });
      return NextResponse.json(newTrigger, { status: 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating auto message trigger:", dbError);
      return NextResponse.json({ message: 'Database error creating trigger.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/auto-message-triggers:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for trigger creation.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create auto message trigger', error: error.message }, { status: 500 });
  }
}
