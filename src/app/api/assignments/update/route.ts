
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/assignments/update - Assign or unassign a supervisor for an employee
export async function POST(request: Request) {
  try {
    const { employeeId, supervisorId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
    }
    
    const newSupervisorId = supervisorId === "--NONE--" || supervisorId === "" ? null : supervisorId;

    try {
      const updatedEmployee = await prisma.user.update({
        where: { id: employeeId },
        data: {
          supervisorId: newSupervisorId,
        },
        include: { 
          supervisor: true,
        }
      });
      return NextResponse.json(updatedEmployee, { status: 200 });
    } catch (dbError: any) {
      console.error("Prisma error updating supervisor assignment:", dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'Employee not found for assignment update.' }, { status: 404 });
      }
      if (dbError.code === 'P2003') { 
          return NextResponse.json({ message: 'Assigned supervisor ID does not exist.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error during supervisor assignment.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error processing supervisor assignment request:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for assignment.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update supervisor assignment', error: error.message }, { status: 500 });
  }
}
