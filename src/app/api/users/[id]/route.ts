
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

interface Params {
  id: string;
}

// GET /api/users/[id] - Fetch a single user by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        supervisor: true,
        supervisedEmployees: true,
        performanceScoresGiven: true,
        performanceScoresReceived: {
          include: {
            criteria: true,
            evaluator: true,
          }
        },
        workOutputs: true,
        attendanceRecords: true,
      },
    });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    const data = await request.json();
    const { name, email, department, position, hireDate, avatarUrl, role, supervisorId } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (hireDate) updateData.hireDate = new Date(hireDate);
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl; // Allow setting to null or empty string
    if (role) updateData.role = role as UserRole;
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId === "--NONE--" || supervisorId === "" ? null : supervisorId;


    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
     if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Email already exists for another user' }, { status: 409 });
    }
    if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = params;
  try {
    // Need to handle relations:
    // 1. Unassign employees this user supervises
    await prisma.user.updateMany({
      where: { supervisorId: id },
      data: { supervisorId: null },
    });
    // 2. Nullify evaluatorId in PerformanceScore if this user was an evaluator
     await prisma.performanceScore.updateMany({
      where: { evaluatorId: id },
      data: { evaluatorId: null }, // Or handle as per app logic, maybe delete?
    });

    // Now delete the user
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
