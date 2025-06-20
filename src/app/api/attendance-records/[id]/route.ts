
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { AttendanceStatusType } from '@/types'; // Using string literal union

interface Params {
  id: string;
}

// GET /api/attendance-records/[id] - Fetch a single attendance record
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Attendance record ID is required.' }, { status: 400 });
    }
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
    } catch (dbError: any) {
      console.error(`Prisma error fetching attendance record ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching attendance record.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/attendance-records/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch attendance record', error: error.message }, { status: 500 });
  }
}


// PUT /api/attendance-records/[id] - Update an attendance record
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Attendance record ID is required for update.' }, { status: 400 });
    }
    const data = await request.json();
    const { employeeId, date, status, notes } = data;

    const updateData: any = {};
    if (employeeId) updateData.employeeId = employeeId; 
    if (date) updateData.date = new Date(date);
    if (status) {
        const validStatuses: AttendanceStatusType[] = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"];
        if (!validStatuses.includes(status as AttendanceStatusType)) {
            return NextResponse.json({ message: `Invalid attendance status: ${status}` }, { status: 400 });
        }
        updateData.status = status as AttendanceStatusType; // status is string
    }
    if (notes !== undefined) updateData.notes = notes;

    try {
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedRecord);
    } catch (dbError: any) {
      console.error(`Prisma error updating attendance record ${id}:`, dbError);
      if (dbError.code === 'P2025') {
          return NextResponse.json({ message: 'Attendance record not found for update.' }, { status: 404 });
      }
      if (dbError.code === 'P2003') {
          return NextResponse.json({ message: 'Invalid employee ID for attendance record.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error updating attendance record.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in PUT /api/attendance-records/[id] for id ${params?.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for attendance update.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update attendance record', error: error.message }, { status: 500 });
  }
}

// DELETE /api/attendance-records/[id] - Delete an attendance record
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Attendance record ID is required for deletion.' }, { status: 400 });
    }
    try {
      await prisma.attendanceRecord.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
    } catch (dbError: any) {
      console.error(`Prisma error deleting attendance record ${id}:`, dbError);
      if (dbError.code === 'P2025') {
          return NextResponse.json({ message: 'Attendance record not found for deletion.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting attendance record.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/attendance-records/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete attendance record', error: error.message }, { status: 500 });
  }
}
