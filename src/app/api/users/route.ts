
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRoleType } from '@/types'; // Using string literal union from types
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// GET /api/users - Fetch all users or users by supervisorId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId'); // Corrected typo here

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
    // Ensure a JSON response even for unexpected errors
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
    const { name, email, department, position, hireDate, avatarUrl, role, supervisorId, password } = data;

    if (!name || !email || !department || !position || !hireDate || !role || !password) {
      return NextResponse.json({ message: 'Missing required fields. Name, email, department, position, hire date, role, and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // Validate role against UserRoleType
    const validRoles: UserRoleType[] = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];
    if (!validRoles.includes(role as UserRoleType)) {
        return NextResponse.json({ message: `Invalid role specified: ${role}` }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department,
        position,
        hireDate: new Date(hireDate),
        avatarUrl,
        role: role, // Prisma schema expects a string
        supervisorId: supervisorId || null,
      },
    });

    const { password: _, ...userToReturn } = newUser;

    return NextResponse.json(userToReturn, { status: 201 });
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
      status = 409; // Conflict
      responseBody.message = 'This email address is already in use. Please choose another one.';
      responseBody.error = 'Email conflict';
    } else if (error.code === 'P2003' && error.meta?.field_name?.includes('supervisorId')) {
      status = 400; // Bad Request
      responseBody.message = 'Assigned supervisor ID does not exist.';
      responseBody.error = 'Invalid supervisorId';
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
