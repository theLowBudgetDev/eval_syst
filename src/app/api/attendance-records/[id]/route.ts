
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { AttendanceStatus } from '@prisma/client';

interface Params {
  id: string;
}

// GET /api/attendance-records/[id] - Fetch a single attendance record
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });
    if (!record) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error(`Error fetching attendance record ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch attendance record', error: (error as Error).message }, { status: 500 });
  }
}


// PUT /api/attendance-records/[id] - Update an attendance record
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const data = await request.json();
    const { employeeId, date, status, notes } = data;

    const updateData: any = {};
    // employeeId typically should not change for an existing record, but included if needed
    if (employeeId) updateData.employeeId = employeeId; 
    if (date) updateData.date = new Date(date);
    if (status) updateData.status = status as AttendanceStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error(`Error updating attendance record ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update attendance record', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/attendance-records/[id] - Delete an attendance record
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    await prisma.attendanceRecord.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting attendance record ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete attendance record', error: (error as Error).message }, { status: 500 });
  }
}
