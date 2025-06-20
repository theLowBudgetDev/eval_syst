
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { AttendanceStatus } from '@prisma/client';

// GET /api/attendance-records - Fetch all attendance records
export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: {
        employee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: {
        date: 'desc',
      }
    });
    return NextResponse.json(records);
  } catch (dbError: any) {
    console.error("Prisma error fetching attendance records:", dbError);
    return NextResponse.json({ message: 'Database error fetching attendance records.', error: dbError.message, code: dbError.code }, { status: 500 });
  }
}

// POST /api/attendance-records - Create or update an attendance record
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, date, status, notes, id } = data; 

    if (!employeeId || !date || !status) {
      return NextResponse.json({ message: 'Employee ID, date, and status are required' }, { status: 400 });
    }
    
    const recordData = {
      employeeId,
      date: new Date(date),
      status: status as AttendanceStatus,
      notes,
    };

    try {
      let attendanceRecord;
      if (id) { 
        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id },
          data: recordData,
        });
      } else { 
        attendanceRecord = await prisma.attendanceRecord.create({
          data: recordData,
        });
      }
      return NextResponse.json(attendanceRecord, { status: id ? 200 : 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating/updating attendance record:", dbError);
      if (dbError.code === 'P2003') { 
          return NextResponse.json({ message: 'Invalid employee ID for attendance record.' }, { status: 400 });
      }
      if (dbError.code === 'P2025' && id) { 
          return NextResponse.json({ message: 'Attendance record not found for update.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error processing attendance record.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/attendance-records:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for attendance record.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to process attendance record request', error: error.message }, { status: 500 });
  }
}
