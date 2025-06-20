
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { MessageEventType } from '@prisma/client';

interface Params {
  id: string;
}

// GET /api/auto-message-triggers/[id] - Fetch a single trigger
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const trigger = await prisma.autoMessageTrigger.findUnique({
      where: { id },
    });
    if (!trigger) {
      return NextResponse.json({ message: 'Auto message trigger not found' }, { status: 404 });
    }
    return NextResponse.json(trigger);
  } catch (error) {
    console.error(`Error fetching auto message trigger ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch auto message trigger', error: (error as Error).message }, { status: 500 });
  }
}


// PUT /api/auto-message-triggers/[id] - Update an auto message trigger
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const data = await request.json();
    const { eventName, messageTemplate, isActive, daysBeforeEvent } = data;

    const updateData: any = {};
    if (eventName) updateData.eventName = eventName as MessageEventType;
    if (messageTemplate) updateData.messageTemplate = messageTemplate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (daysBeforeEvent !== undefined) updateData.daysBeforeEvent = daysBeforeEvent ? parseInt(daysBeforeEvent, 10) : null;

    const updatedTrigger = await prisma.autoMessageTrigger.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedTrigger);
  } catch (error) {
    console.error(`Error updating auto message trigger ${id}:`, error);
     if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Auto message trigger not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update auto message trigger', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/auto-message-triggers/[id] - Delete an auto message trigger
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    await prisma.autoMessageTrigger.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Auto message trigger deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting auto message trigger ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Auto message trigger not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete auto message trigger', error: (error as Error).message }, { status: 500 });
  }
}
