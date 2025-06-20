
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/assignments/update - Assign or unassign a supervisor for an employee
export async function POST(request: Request) {
  try {
    const { employeeId, supervisorId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
    }
    
    // supervisorId can be null to unassign
    const newSupervisorId = supervisorId === "--NONE--" || supervisorId === "" ? null : supervisorId;

    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        supervisorId: newSupervisorId,
      },
      include: { // Optionally return the updated supervisor details
        supervisor: true,
      }
    });

    return NextResponse.json(updatedEmployee, { status: 200 });
  } catch (error) {
    console.error("Error updating supervisor assignment:", error);
    if ((error as any).code === 'P2025') { // Record to update not found (employeeId)
        return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed (supervisorId does not exist)
        return NextResponse.json({ message: 'Supervisor not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update supervisor assignment', error: (error as Error).message }, { status: 500 });
  }
}
