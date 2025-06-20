
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

  } catch (error: any) {
    console.error(`Critical error in GET /api/users/[id] for id ${params?.id}:`, error);
    const errorMessage = error.message || 'An unexpected error occurred on the server.';
    const errorCode = error.code;
    return new Response(JSON.stringify({ message: 'Failed to fetch user details due to a server error.', error: errorMessage, code: errorCode }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedUser);

  } catch (error: any) {
    console.error(`Critical error in PUT /api/users/[id] for id ${params?.id}:`, error);
    let status = 500;
    const responseBody: { message: string; error?: string; code?: string, details?: any } = {
      message: 'Failed to update user profile due to a server error.',
      error: error.message || 'An unexpected error occurred.',
      code: error.code
    };
    
    if (error instanceof SyntaxError) {
        status = 400;
        responseBody.message = 'Invalid JSON payload for user update.';
        responseBody.error = error.message;
    } else if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      status = 409;
      responseBody.message = 'This email address is already in use. Please choose another one.';
      responseBody.error = 'Email conflict';
    } else if (error.code === 'P2025') {
      status = 404;
      responseBody.message = 'User not found. Could not update.';
      responseBody.error = 'User not found';
    } else if (error.code === 'P2003' && error.meta?.field_name?.includes('supervisorId')) {
      status = 400;
      responseBody.message = 'Assigned supervisor ID does not exist.';
      responseBody.error = 'Invalid supervisorId';
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'User ID is required for deletion.' }, { status: 400 });
    }
    
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

  } catch (error: any) {
    console.error(`Critical error in DELETE /api/users/[id] for id ${params?.id}:`, error);
    let status = 500;
     const responseBody: { message: string; error?: string; code?: string, details?: any } = {
      message: 'Failed to delete user due to a server error.',
      error: error.message || 'An unexpected error occurred.',
      code: error.code
    };

    if (error.code === 'P2025') {
      status = 404;
      responseBody.message = 'User not found. Could not delete.';
      responseBody.error = 'User not found';
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
