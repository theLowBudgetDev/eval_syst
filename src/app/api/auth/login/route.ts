
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import type { AppUser } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      // No need to include supervisor here initially, fetch separately if needed and select fields
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_LOGIN_FAILURE',
          details: { email, reason: 'User not found' },
        },
      });
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Ensure user.password is not null or undefined before bcrypt.compare
    if (!user.password) {
        // This case should ideally not happen if password is required in your schema and data integrity is maintained
        console.error(`User ${user.email} has no password set.`);
        await prisma.auditLog.create({
            data: {
              action: 'AUTH_LOGIN_FAILURE',
              details: { email, reason: 'User has no password in database' },
            },
        });
        return NextResponse.json({ message: 'Authentication error. Please contact support.' }, { status: 500 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILURE',
          details: { email: user.email, reason: 'Password mismatch' },
        },
      });
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Construct the user object to return, excluding the password
    const { password: _, ...userWithoutPassword } = user;

    let supervisorDetails: AppUser['supervisor'] = null;
    if (user.supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: {id: user.supervisorId},
            select: { // Explicitly select non-sensitive fields for the supervisor
                id: true,
                name: true,
                email: true,
                department: true,
                position: true,
                hireDate: true,
                avatarUrl: true,
                role: true,
                // DO NOT include password or other sensitive supervisor fields here
            }
        });
        if (supervisor) {
            supervisorDetails = {
                ...supervisor,
                hireDate: supervisor.hireDate.toISOString(), // Ensure date is string
            };
        }
    }


    const userForClient: AppUser = {
      ...userWithoutPassword,
      hireDate: user.hireDate.toISOString(), // Ensure date is string for client
      supervisor: supervisorDetails,
      // Explicitly set other optional fields from AppUser to null/undefined if not present
      // These are typically fetched on demand or not needed for initial login context
      supervisedEmployees: undefined, 
      performanceScoresReceived: undefined,
      performanceScoresGiven: undefined,
      workOutputs: undefined,
      attendanceRecords: undefined,
      goalsAsEmployee: undefined,
      goalsAsSupervisor: undefined,
      auditLogs: undefined,
    };


    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        details: { email: user.email },
      },
    });

    return NextResponse.json(userForClient);

  } catch (error) {
    console.error('Login error:', error);
    // Log generic error to audit log if specific user context is not available
    await prisma.auditLog.create({
      data: {
        action: 'AUTH_LOGIN_FAILURE',
        details: { error: (error as Error).message, reason: 'Server error during login attempt' },
      },
    }).catch(auditError => console.error('Failed to write audit log for login error:', auditError)); // Avoid crashing if audit log fails
    
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
