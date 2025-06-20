
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

// GET /api/users - Fetch all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        supervisor: true, // Include the supervisor details
        supervisedEmployees: true, // Include employees supervised by this user
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
        hireDate: new Date(hireDate), // Ensure hireDate is a Date object
        avatarUrl,
        role: role as UserRole, // Make sure role is a valid UserRole
        supervisorId: supervisorId || null,
      },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    // Check for unique constraint violation for email
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
