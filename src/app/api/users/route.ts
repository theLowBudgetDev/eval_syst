
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRoleType } from '@/types'; // Using string literal union from types

// GET /api/users - Fetch all users or users by supervisorId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');

    const users = await prisma.user.findMany({
      where: supervisorId ? { supervisorId } : {},
      include: {
        supervisor: true,
        supervisedEmployees: true,
      },
      orderBy: {
        name: 'asc',
      }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Critical error in GET /api/users:", error);
    const errorMessage = error.message || 'An unexpected error occurred on the server.';
    const errorCode = error.code;
    return new Response(JSON.stringify({ message: 'Failed to process request for users due to a server error.', error: errorMessage, code: errorCode }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, department, position, hireDate, avatarUrl, role, supervisorId } = data;

    if (!name || !email || !department || !position || !hireDate || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Validate role against UserRoleType
    const validRoles: UserRoleType[] = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];
    if (!validRoles.includes(role as UserRoleType)) {
        return NextResponse.json({ message: `Invalid role specified: ${role}` }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        department,
        position,
        hireDate: new Date(hireDate),
        avatarUrl,
        role: role as UserRoleType, // role is a string, but matches UserRoleType
        supervisorId: supervisorId || null,
      },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Critical error in POST /api/users:", error);
    let status = 500;
    const responseBody: { message: string; error?: string; code?: string, details?: any } = {
      message: 'Failed to create user due to a server error.',
      error: error.message || 'An unexpected error occurred.',
      code: error.code
    };

    if (error instanceof SyntaxError) { 
        status = 400;
        responseBody.message = 'Invalid JSON payload for user creation.';
        responseBody.error = error.message;
    } else if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      status = 409;
      responseBody.message = 'This email address is already in use. Please choose another one.';
      responseBody.error = 'Email conflict';
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
