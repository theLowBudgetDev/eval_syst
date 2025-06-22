
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Goal, GoalStatusType, UserRoleType } from '@/types';
import { headers } from 'next/headers'; // Assuming you have a way to get current user from session/token

// Helper function to get current user (placeholder - replace with your actual auth logic)
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  // In a real app, you'd get this from a session, token, or other auth mechanism
  // For this example, we'll extract it from a custom header if provided, or return null
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole) {
    return { id: userId, role: userRole };
  }
  // Fallback or mock for testing if headers are not set (REMOVE FOR PRODUCTION)
  // return { id: "emp01", role: "EMPLOYEE"}; 
  // return { id: "sup01", role: "SUPERVISOR"};
  // return { id: "admin01", role: "ADMIN"};
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
    // Admin can create for anyone.
    // Supervisor can create for themselves or their team members.
    // Employee can only create for themselves.
    let effectiveEmployeeId = employeeId;
    if (currentUser.role === 'EMPLOYEE') {
        if (employeeId !== currentUser.id) {
            return NextResponse.json({ message: 'Forbidden: You can only create goals for yourself.' }, { status: 403 });
        }
        effectiveEmployeeId = currentUser.id;
    } else if (currentUser.role === 'SUPERVISOR') {
        if (employeeId !== currentUser.id) { // If supervisor is creating for someone else
            const targetEmployee = await prisma.user.findUnique({ where: { id: employeeId }});
            if (!targetEmployee || targetEmployee.supervisorId !== currentUser.id) {
                 return NextResponse.json({ message: 'Forbidden: You can only create goals for your team members or yourself.' }, { status: 403 });
            }
        }
         // If creating for self, employeeId is already currentUser.id
    }
    // Admin has no restrictions on employeeId


    let supervisorForGoal: string | null = null;
    if (currentUser.role === 'SUPERVISOR' && effectiveEmployeeId !== currentUser.id) {
        // If a supervisor is creating a goal for their direct report, assign the supervisor.
        supervisorForGoal = currentUser.id;
    } else if (currentUser.role === 'ADMIN' && effectiveEmployeeId !== currentUser.id) {
        // If an admin is creating a goal for someone, check if that person has a supervisor.
        const targetUser = await prisma.user.findUnique({ where: {id: effectiveEmployeeId }});
        if (targetUser?.supervisorId) {
            supervisorForGoal = targetUser.supervisorId;
        }
    }


    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        status: status as GoalStatusType,
        dueDate: dueDate ? new Date(dueDate) : null,
        employeeId: effectiveEmployeeId,
        supervisorId: supervisorForGoal, 
      },
    });

    // Create a notification if someone else created the goal for the employee
    if (currentUser.id !== effectiveEmployeeId) {
        const message = title.startsWith('Feedback Request from')
            ? `sent you a feedback request.`
            : `assigned you a new goal: "${newGoal.title.substring(0, 30)}..."`;

        await prisma.notification.create({
            data: {
                recipientId: effectiveEmployeeId,
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
