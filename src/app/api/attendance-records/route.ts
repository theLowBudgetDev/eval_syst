
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
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json({ message: 'Failed to fetch attendance records', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/attendance-records - Create or update an attendance record
// This might be better as upsert or separate POST for create and PUT for update
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, date, status, notes, id } = data; // id is optional for updates

    if (!employeeId || !date || !status) {
      return NextResponse.json({ message: 'Employee ID, date, and status are required' }, { status: 400 });
    }
    
    const recordData = {
      employeeId,
      date: new Date(date),
      status: status as AttendanceStatus,
      notes,
    };

    let attendanceRecord;
    if (id) { // If ID is provided, attempt to update
      attendanceRecord = await prisma.attendanceRecord.update({
        where: { id },
        data: recordData,
      });
    } else { // Otherwise, create a new record
      // Optional: Check if a record for this employee and date already exists to prevent duplicates if not desired
      // const existingRecord = await prisma.attendanceRecord.findFirst({ where: { employeeId, date: new Date(date) }});
      // if (existingRecord) return NextResponse.json({ message: 'Record for this date already exists' }, { status: 409 });

      attendanceRecord = await prisma.attendanceRecord.create({
        data: recordData,
      });
    }
    return NextResponse.json(attendanceRecord, { status: id ? 200 : 201 });
  } catch (error) {
    console.error("Error creating/updating attendance record:", error);
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }
    if ((error as any).code === 'P2025' && id) { // Record to update not found
        return NextResponse.json({ message: 'Attendance record not found for update' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to process attendance record', error: (error as Error).message }, { status: 500 });
  }
}
