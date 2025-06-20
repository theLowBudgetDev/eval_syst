
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { MessageEventType } from '@/types'; // Using string literal union

interface Params {
  id: string;
}

// GET /api/auto-message-triggers/[id] - Fetch a single trigger
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Trigger ID is required.' }, { status: 400 });
    }
    try {
      const trigger = await prisma.autoMessageTrigger.findUnique({
        where: { id },
      });
      if (!trigger) {
        return NextResponse.json({ message: 'Auto message trigger not found' }, { status: 404 });
      }
      return NextResponse.json(trigger);
    } catch (dbError: any) {
      console.error(`Prisma error fetching auto message trigger ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching trigger.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/auto-message-triggers/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch auto message trigger', error: error.message }, { status: 500 });
  }
}


// PUT /api/auto-message-triggers/[id] - Update an auto message trigger
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Trigger ID is required for update.' }, { status: 400 });
    }
    const data = await request.json();
    const { eventName, messageTemplate, isActive, daysBeforeEvent } = data;

    const updateData: any = {};
    if (eventName) {
        const validEventTypes: MessageEventType[] = ["DEADLINE_APPROACHING", "REVIEW_DUE", "FEEDBACK_REQUEST", "EVALUATION_COMPLETED", "NEW_ASSIGNMENT"];
        if (!validEventTypes.includes(eventName as MessageEventType)) {
            return NextResponse.json({ message: `Invalid event name: ${eventName}` }, { status: 400 });
        }
        updateData.eventName = eventName as MessageEventType; // eventName is string
    }
    if (messageTemplate) updateData.messageTemplate = messageTemplate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (daysBeforeEvent !== undefined) updateData.daysBeforeEvent = daysBeforeEvent ? parseInt(daysBeforeEvent, 10) : null;


    try {
      const updatedTrigger = await prisma.autoMessageTrigger.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedTrigger);
    } catch (dbError: any) {
      console.error(`Prisma error updating auto message trigger ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Auto message trigger not found for update.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error updating trigger.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in PUT /api/auto-message-triggers/[id] for id ${params?.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for trigger update.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update auto message trigger', error: error.message }, { status: 500 });
  }
}

// DELETE /api/auto-message-triggers/[id] - Delete an auto message trigger
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Trigger ID is required for deletion.' }, { status: 400 });
    }
    try {
      await prisma.autoMessageTrigger.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Auto message trigger deleted successfully' }, { status: 200 });
    } catch (dbError: any) {
      console.error(`Prisma error deleting auto message trigger ${id}:`, dbError);
      if (dbError.code === 'P2025') {
          return NextResponse.json({ message: 'Auto message trigger not found for deletion.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting trigger.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/auto-message-triggers/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete auto message trigger', error: error.message }, { status: 500 });
  }
}
