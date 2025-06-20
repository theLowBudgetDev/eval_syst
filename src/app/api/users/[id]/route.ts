
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

interface Params {
  id: string;
}

// GET /api/users/[id] - Fetch a single user by ID
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          supervisor: true,
          supervisedEmployees: true,
          performanceScoresGiven: {
            include: {
              employee: { select: { name: true, avatarUrl: true } },
              criteria: { select: { name: true } },
            },
            orderBy: { evaluationDate: 'desc' }
          },
          performanceScoresReceived: {
            include: {
              criteria: true,
              evaluator: { select: { name: true, avatarUrl: true } },
            },
            orderBy: { evaluationDate: 'desc' }
          },
          workOutputs: {
            orderBy: { submissionDate: 'desc' }
          },
          attendanceRecords: {
            orderBy: { date: 'desc' }
          },
        },
      });
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    } catch (dbError: any) {
      console.error(`Prisma error fetching user ${id}:`, dbError);
      return NextResponse.json({ message: 'Database error fetching user details.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/users/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user details.', error: error.message }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'User ID is required for update.' }, { status: 400 });
    }
    const data = await request.json();
    const { name, email, department, position, hireDate, avatarUrl, role, supervisorId } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (hireDate) updateData.hireDate = new Date(hireDate);
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl; 
    if (role) updateData.role = role as UserRole;
    
    if (supervisorId !== undefined) {
        updateData.supervisorId = supervisorId === "--NONE--" || supervisorId === "" || supervisorId === null ? null : supervisorId;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedUser);
    } catch (dbError: any) {
      console.error(`Prisma error updating user ${id}:`, dbError);
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('email')) {
        return NextResponse.json({ message: 'This email address is already in use. Please choose another one.' }, { status: 409 });
      }
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'User not found. Could not update.' }, { status: 404 });
      }
      if (dbError.code === 'P2003' && dbError.meta?.field_name?.includes('supervisorId')) { 
          return NextResponse.json({ message: 'Assigned supervisor ID does not exist.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error updating user profile.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in PUT /api/users/[id] for id ${params?.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for user update.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update user profile.', error: error.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'User ID is required for deletion.' }, { status: 400 });
    }
    try {
      const supervisedCount = await prisma.user.count({
        where: { supervisorId: id }
      });

      if (supervisedCount > 0) {
        return NextResponse.json({ 
          message: `Cannot delete user. This user supervises ${supervisedCount} employee(s). Please reassign them first.` 
        }, { status: 409 }); 
      }
      
      await prisma.performanceScore.updateMany({
        where: { evaluatorId: id },
        data: { evaluatorId: null }, 
      });

      await prisma.user.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (dbError: any) {
      console.error(`Prisma error deleting user ${id}:`, dbError);
      if (dbError.code === 'P2025') { 
          return NextResponse.json({ message: 'User not found. Could not delete.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Database error deleting user.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/users/[id] for id ${params?.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user.', error: error.message }, { status: 500 });
  }
}
