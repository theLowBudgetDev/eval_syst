
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Goal, GoalStatusType, UserRoleType } from '@/types';
import { headers } from 'next/headers';

// Helper function to get current user
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  return null;
}


export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeIdQuery = searchParams.get('employeeId');

    let whereClause: any = {};

    if (currentUser.role === 'ADMIN') {
      if (employeeIdQuery) {
        whereClause.employeeId = employeeIdQuery;
      }
      // Admin sees all goals or goals for a specific employee if employeeIdQuery is present
    } else if (currentUser.role === 'SUPERVISOR') {
      const supervisedEmployees = await prisma.user.findMany({
        where: { supervisorId: currentUser.id },
        select: { id: true },
      });
      const supervisedEmployeeIds = supervisedEmployees.map(emp => emp.id);
      
      if (employeeIdQuery) { // Supervisor wants to see goals for a specific employee
        if (supervisedEmployeeIds.includes(employeeIdQuery) || employeeIdQuery === currentUser.id) {
           whereClause.employeeId = employeeIdQuery;
        } else {
            return NextResponse.json({ message: 'Forbidden: You can only view goals for your team or yourself.' }, { status: 403 });
        }
      } else { // Supervisor sees goals for all their team members and their own
         whereClause.OR = [
            { employeeId: { in: supervisedEmployeeIds } },
            { employeeId: currentUser.id }
         ];
      }
    } else { // EMPLOYEE
      whereClause.employeeId = currentUser.id;
      if (employeeIdQuery && employeeIdQuery !== currentUser.id) {
         return NextResponse.json({ message: 'Forbidden: You can only view your own goals.' }, { status: 403 });
      }
    }

    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        employee: { select: { id: true, name: true, avatarUrl: true } },
        supervisor: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
    return NextResponse.json(goals);
  } catch (error: any) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ message: 'Failed to fetch goals', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, status, dueDate, employeeId } = data;

    if (!title || !status || !employeeId) {
      return NextResponse.json({ message: 'Title, status, and employeeId are required' }, { status: 400 });
    }
    
    const validStatuses: GoalStatusType[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
    if (!validStatuses.includes(status as GoalStatusType)) {
        return NextResponse.json({ message: `Invalid goal status: ${status}` }, { status: 400 });
    }

    // Permission check:
    const isFeedbackRequest = title.startsWith('Feedback Request from');
    if (currentUser.role === 'EMPLOYEE') {
        const userFromDb = await prisma.user.findUnique({ where: { id: currentUser.id } });
        if (employeeId !== currentUser.id && !(isFeedbackRequest && employeeId === userFromDb?.supervisorId)) {
            return NextResponse.json({ message: 'Forbidden: You can only create goals for yourself or request feedback from your supervisor.' }, { status: 403 });
        }
    } else if (currentUser.role === 'SUPERVISOR') {
        if (employeeId !== currentUser.id) { // If supervisor is creating for someone else
            const targetEmployee = await prisma.user.findUnique({ where: { id: employeeId }});
            if (!targetEmployee || targetEmployee.supervisorId !== currentUser.id) {
                 return NextResponse.json({ message: 'Forbidden: You can only create goals for your team members or yourself.' }, { status: 403 });
            }
        }
    }
    // Admin has no restrictions on employeeId

    const targetUserForGoal = await prisma.user.findUnique({ where: { id: employeeId }});
    let supervisorForGoal: string | null = targetUserForGoal?.supervisorId || null;
    
    // if a supervisor creates a goal for one of their team, they are the supervisor for that goal
    if (currentUser.role === 'SUPERVISOR' && targetUserForGoal?.supervisorId === currentUser.id) {
        supervisorForGoal = currentUser.id;
    }


    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        status: status as GoalStatusType,
        dueDate: dueDate ? new Date(dueDate) : null,
        employeeId: employeeId,
        supervisorId: supervisorForGoal, 
      },
    });

    // Create a notification if someone else created the goal for the employee
    if (currentUser.id !== employeeId) {
        const message = isFeedbackRequest
            ? `sent you a feedback request.`
            : `assigned you a new goal: "${newGoal.title.substring(0, 30)}..."`;

        await prisma.notification.create({
            data: {
                recipientId: employeeId,
                actorId: currentUser.id,
                message: message,
                link: '/goals',
            }
        });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    console.error("Error creating goal:", error);
    if (error.code === 'P2003') { // Foreign key constraint (e.g. employeeId doesn't exist)
        return NextResponse.json({ message: 'Invalid employee ID provided for the goal.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create goal', error: error.message }, { status: 500 });
  }
}
