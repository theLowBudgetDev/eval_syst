
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Goal, GoalStatusType, UserRoleType } from '@/types';
import { headers } from 'next/headers';

interface Params {
  id: string;
}

// Helper function to get current user (placeholder - replace with your actual auth logic)
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  // Fallback for testing if headers not set (REMOVE FOR PRODUCTION)
  // return { id: "emp01", role: "EMPLOYEE"}; 
  // return { id: "sup01", role: "SUPERVISOR"};
  // return { id: "admin01", role: "ADMIN"};
  return null;
}

// Helper to check if user can access/modify a goal
async function canAccessGoal(goalId: string, currentUser: { id: string; role: UserRoleType }): Promise<boolean> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return false;

  if (currentUser.role === 'ADMIN') return true;
  if (currentUser.role === 'EMPLOYEE' && goal.employeeId === currentUser.id) return true;
  if (currentUser.role === 'SUPERVISOR') {
    if (goal.employeeId === currentUser.id) return true; // Supervisor's own goal
    const targetEmployee = await prisma.user.findUnique({ where: { id: goal.employeeId } });
    if (targetEmployee?.supervisorId === currentUser.id) return true; // Goal for a team member
  }
  return false;
}


export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Goal ID is required.' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!await canAccessGoal(id, currentUser)) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to view this goal.' }, { status: 403 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, avatarUrl: true } },
        supervisor: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json(goal);
  } catch (error: any) {
    console.error("Error fetching goal:", error);
    return NextResponse.json({ message: 'Failed to fetch goal', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Goal ID is required for update.' }, { status: 400 });
    }
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!await canAccessGoal(id, currentUser)) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to update this goal.' }, { status: 403 });
    }

    const data = await request.json();
    const { title, description, status, dueDate, employeeId } = data; // employeeId might be part of payload if admin changes it

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) {
        const validStatuses: GoalStatusType[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
        if (!validStatuses.includes(status as GoalStatusType)) {
            return NextResponse.json({ message: `Invalid goal status: ${status}` }, { status: 400 });
        }
        updateData.status = status as GoalStatusType;
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    
    // Only Admin can change employeeId of an existing goal
    if (employeeId && currentUser.role === 'ADMIN' && employeeId !== (await prisma.goal.findUnique({where: {id}}))?.employeeId) {
        updateData.employeeId = employeeId;
        // Potentially re-evaluate supervisorId if employee changes
        const targetUser = await prisma.user.findUnique({ where: {id: employeeId }});
        updateData.supervisorId = targetUser?.supervisorId || null;
    }


    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    console.error("Error updating goal:", error);
    if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Goal not found for update.' }, { status: 404 });
    }
    if (error.code === 'P2003' && error.meta?.field_name?.includes('employeeId')) {
        return NextResponse.json({ message: 'Invalid employee ID for goal.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update goal', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Goal ID is required for deletion.' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!await canAccessGoal(id, currentUser)) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to delete this goal.' }, { status: 403 });
    }
    
    await prisma.goal.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Goal deleted successfully' }, { status: 200 });
  } catch (error: any)
{
    console.error("Error deleting goal:", error);
    if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'Goal not found for deletion.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete goal', error: error.message }, { status: 500 });
  }
}
