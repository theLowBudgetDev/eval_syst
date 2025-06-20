
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

// GET /api/users - Fetch all users or users by supervisorId
export async function GET(request: Request) {
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
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
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
  } catch (error) {
    console.error("Error creating user:", error);
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'This email address is already in use. Please choose another one.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
