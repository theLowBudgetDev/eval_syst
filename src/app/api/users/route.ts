
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

// GET /api/users - Fetch all users or users by supervisorId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');

    try {
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
    } catch (dbError: any) {
      console.error("Prisma error fetching users:", dbError);
      return NextResponse.json({ message: 'Database error while fetching users.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json({ message: 'Failed to process request for users', error: error.message }, { status: 500 });
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

    try {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          department,
          position,
          hireDate: new Date(hireDate), 
          avatarUrl,
          role: role as UserRole, 
          supervisorId: supervisorId || null,
        },
      });
      return NextResponse.json(newUser, { status: 201 });
    } catch (dbError: any) {
      console.error("Prisma error creating user:", dbError);
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('email')) {
        return NextResponse.json({ message: 'This email address is already in use. Please choose another one.' }, { status: 409 });
      }
      if (dbError.code === 'P2003' && dbError.meta?.field_name?.includes('supervisorId')) { 
          return NextResponse.json({ message: 'Assigned supervisor ID does not exist.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Database error while creating user.', error: dbError.message, code: dbError.code }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/users:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload for user creation.'}, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}
