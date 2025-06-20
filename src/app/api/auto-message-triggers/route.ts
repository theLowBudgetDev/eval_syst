
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
  } catch (error) {
    console.error("Error fetching auto message triggers:", error);
    return NextResponse.json({ message: 'Failed to fetch auto message triggers', error: (error as Error).message }, { status: 500 });
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

    const newTrigger = await prisma.autoMessageTrigger.create({
      data: {
        eventName: eventName as MessageEventType,
        messageTemplate,
        isActive: isActive !== undefined ? isActive : true,
        daysBeforeEvent: daysBeforeEvent ? parseInt(daysBeforeEvent, 10) : null,
      },
    });
    return NextResponse.json(newTrigger, { status: 201 });
  } catch (error) {
    console.error("Error creating auto message trigger:", error);
    return NextResponse.json({ message: 'Failed to create auto message trigger', error: (error as Error).message }, { status: 500 });
  }
}
