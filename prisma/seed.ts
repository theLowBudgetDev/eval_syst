
import { PrismaClient } from '@prisma/client';
import type { UserRoleType, AttendanceStatusType, MessageEventType, GoalStatusType, AuditActionType, SystemSetting } from '../src/types';
import { mockAuthUsers as originalMockAuthUsersConfig } from '../src/contexts/AuthContext';
import {
  mockEvaluationCriteria,
  mockPerformanceScores as originalMockPerformanceScores,
  mockWorkOutputs,
  mockAttendanceRecords as originalMockAttendanceRecords,
  mockAutoMessageTriggers,
} from '../src/lib/mockData';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const GLOBAL_SETTINGS_ID = "global_settings";
const SALT_ROUNDS = 10; // For bcrypt password hashing

// Add a plainTextPassword to the mock user config temporarily for seeding
const mockAuthUsersWithPasswords = originalMockAuthUsersConfig.map(user => ({
  ...user,
  plainTextPassword: "password123" // Assign a default password for all mock users
}));

async function main() {
  console.log('Start seeding ...');

  // Clear existing data in a safe order
  await prisma.auditLog.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.performanceScore.deleteMany();
  await prisma.workOutput.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.autoMessageTrigger.deleteMany();
  await prisma.evaluationCriteria.deleteMany();
  await prisma.systemSetting.deleteMany();
  // Delete users ensuring supervised employees are deleted first or supervisorId is nullable
  await prisma.user.deleteMany({ where: { supervisorId: { not: null } } });
  await prisma.user.deleteMany({ where: { supervisorId: null } });


  // Seed System Settings
  await prisma.systemSetting.upsert({
    where: { id: GLOBAL_SETTINGS_ID },
    update: {},
    create: {
      id: GLOBAL_SETTINGS_ID,
      appName: "EvalTrack Pro",
      systemTheme: "dark",
      maintenanceMode: false,
      notificationsEnabled: true,
      emailNotifications: true,
    },
  });
  console.log('Seeded system settings.');

  const supervisorUsers = mockAuthUsersWithPasswords.filter(u => u.role === 'SUPERVISOR');
  const adminUsers = mockAuthUsersWithPasswords.filter(u => u.role === 'ADMIN');
  const employeeUsers = mockAuthUsersWithPasswords.filter(u => u.role === 'EMPLOYEE');

  const createdUsersMap: { [mockId: string]: string } = {};

  for (const user of [...adminUsers, ...supervisorUsers]) { // Admins and Supervisors first
    const hashedPassword = await bcrypt.hash(user.plainTextPassword, SALT_ROUNDS);
    const created = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword, // Store hashed password
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role as UserRoleType,
      },
    });
    createdUsersMap[user.id] = created.id;
    console.log(`Created ${user.role.toLowerCase()} with id: ${created.id} (original: ${user.id})`);
  }

  for (const user of employeeUsers) {
    const supervisorDbId = user.supervisorId ? createdUsersMap[user.supervisorId] : undefined;
    if (user.supervisorId && !supervisorDbId) {
        console.warn(`Supervisor with mock ID ${user.supervisorId} for employee ${user.name} not found in created users. Skipping supervisor assignment.`);
    }
    const hashedPassword = await bcrypt.hash(user.plainTextPassword, SALT_ROUNDS);
    const created = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword, // Store hashed password
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role as UserRoleType,
        supervisorId: supervisorDbId,
      },
    });
    createdUsersMap[user.id] = created.id;
    console.log(`Created employee with id: ${created.id} (original: ${user.id}), supervisorId: ${supervisorDbId || 'N/A'}`);
  }
  console.log('Seeded users with hashed passwords.');


  const createdCriteria: { [key: string]: string } = {};
  for (const criteria of mockEvaluationCriteria) {
    const created = await prisma.evaluationCriteria.create({
      data: {
        id: criteria.id,
        name: criteria.name,
        description: criteria.description,
        weight: criteria.weight,
      },
    });
    createdCriteria[criteria.id] = created.id;
    console.log(`Created evaluation criteria with id: ${created.id}`);
  }
  console.log('Seeded evaluation criteria.');

  // Programmatically create performance scores
  const allEmployeeUsers = mockAuthUsersWithPasswords.filter(u => u.role === 'EMPLOYEE');
  const allSupervisorUsers = mockAuthUsersWithPasswords.filter(u => u.role === 'SUPERVISOR');
  const criteriaIds = Object.values(createdCriteria);

  for (const employee of allEmployeeUsers) {
    const employeeDbId = createdUsersMap[employee.id];
    if (!employeeDbId) continue;

    // Create a few performance scores for each employee across different criteria
    for (let i = 0; i < Math.min(criteriaIds.length, 5); i++) { // Create up to 5 scores per employee
      const criteriaDbId = criteriaIds[i];
      const scoreValue = Math.floor(Math.random() * 5) + 1; // Random score between 1 and 5
      // Generate evaluation dates within the last year, spaced out
      const evaluationDate = new Date(Date.now() - (i * 60 + Math.random() * 30) * 24 * 60 * 60 * 1000);
      const evaluator = allSupervisorUsers[Math.floor(Math.random() * allSupervisorUsers.length)];
      const evaluatorDbId = evaluator ? createdUsersMap[evaluator.id] : null;

      await prisma.performanceScore.create({
        data: {
          employeeId: employeeDbId,
          criteriaId: criteriaDbId,
          score: scoreValue,
          comments: `Evaluation score for ${employee.name} on ${mockEvaluationCriteria.find(c => createdCriteria[c.id] === criteriaDbId)?.name || 'a criteria'}.`,
          evaluationDate: evaluationDate,
          evaluatorId: evaluatorDbId,
        },
      });
    }
  }
  console.log('Seeded performance scores.');

  // Programmatically create work outputs
  for (const employee of allEmployeeUsers) {
    const employeeDbId = createdUsersMap[employee.id];
    if (employeeDbId) {
      // Create a couple of work outputs for each employee
      for (let i = 0; i < 3; i++) { // Create 3 records per employee
      await prisma.workOutput.create({
        data: {
          employeeId: employeeDbId,
          title: `Report ${i + 1} for Month ${Math.floor(Math.random() * 12) + 1}`,
          description: `Performance report ${i + 1} submitted by ${employee.name}.`,
          fileUrl: `https://example.com/reports/${employee.id}/${Date.now()}-${i}.pdf`,
          submissionDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Within the last 90 days
        },
      });
    }
    } else {
         console.warn(`Skipping work output for mock employeeId ${employee.id} as user DB ID not found.`);
    }
  }
  console.log('Seeded work outputs.');

  // Programmatically create attendance records
  const attendanceStatuses: AttendanceStatusType[] = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"];
  for (const employee of allEmployeeUsers) {
    const employeeDbId = createdUsersMap[employee.id];
     if (employeeDbId) {
       // Create more attendance records spanning several months
       const numberOfAttendanceRecords = 60; // Create 60 records per employee
       for (let i = 0; i < numberOfAttendanceRecords; i++) {
           const attendanceDate = new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000); // One record every 5 days for a longer period
           const prismaStatus: AttendanceStatusType = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
           await prisma.attendanceRecord.create({
             data: {
            employeeId: employeeDbId,
            date: attendanceDate,
            status: prismaStatus,
            notes: `Attendance record for ${employee.name} on ${attendanceDate.toDateString()}` + (prismaStatus === 'LATE' ? ' (Arrived after start time)' : ''),
             },
           });
        }
     }
  }
  console.log('Seeded attendance records.');

  for (const trigger of mockAutoMessageTriggers) {
    const prismaEventName: MessageEventType = trigger.eventName as MessageEventType;
    if (!["DEADLINE_APPROACHING", "REVIEW_DUE", "FEEDBACK_REQUEST", "EVALUATION_COMPLETED", "NEW_ASSIGNMENT"].includes(prismaEventName)) {
        console.warn(`Unknown message event type: ${trigger.eventName}. Skipping trigger.`);
        continue;
    }
    await prisma.autoMessageTrigger.create({
      data: {
        eventName: prismaEventName,
        messageTemplate: trigger.messageTemplate,
        isActive: trigger.isActive,
        daysBeforeEvent: trigger.daysBeforeEvent,
      },
    });
  }
  console.log('Seeded auto message triggers.');

  const firstEmployeeForGoal = mockAuthUsersWithPasswords.find(u => u.role === 'EMPLOYEE');
  const firstSupervisorForGoal = mockAuthUsersWithPasswords.find(u => u.role === 'SUPERVISOR');

  if (firstEmployeeForGoal && createdUsersMap[firstEmployeeForGoal.id]) {
    await prisma.goal.create({
      data: {
        title: "Complete Project Alpha Q3",
        description: "Finalize all modules for Project Alpha and deploy to staging.",
        status: "IN_PROGRESS",
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 15),
        employeeId: createdUsersMap[firstEmployeeForGoal.id],
        supervisorId: firstEmployeeForGoal.supervisorId ? createdUsersMap[firstEmployeeForGoal.supervisorId] : null,
      },
    });
    await prisma.goal.create({
      data: {
        title: "Learn Advanced React Patterns",
        description: "Complete online course and build a demo project.",
        status: "NOT_STARTED",
        employeeId: createdUsersMap[firstEmployeeForGoal.id],
        supervisorId: firstEmployeeForGoal.supervisorId ? createdUsersMap[firstEmployeeForGoal.supervisorId] : null,
      },
    });
  }
  if (firstSupervisorForGoal && createdUsersMap[firstSupervisorForGoal.id]) {
     await prisma.goal.create({
      data: {
        title: "Mentor New Team Hires",
        description: "Onboard and mentor two new engineers joining the team.",
        status: "IN_PROGRESS",
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 1),
        employeeId: createdUsersMap[firstSupervisorForGoal.id],
      },
    });
  }
  console.log('Seeded goals.');

  const adminUserIdForLog = adminUsers[0] ? createdUsersMap[adminUsers[0].id] : null;
  const supervisorUserIdForLog = supervisorUsers[0] ? createdUsersMap[supervisorUsers[0].id] : null;

  if (adminUserIdForLog) {
 await prisma.auditLog.create({
 data: {
 userId: adminUserIdForLog,
 action: "USER_LOGIN" as AuditActionType,
 details: JSON.stringify({ ipAddress: "192.168.1.100", userAgent: "Chrome/90.0" }),
 },
    });
 await prisma.auditLog.create({
 data: {
 userId: adminUserIdForLog,
 action: "SYSTEM_SETTINGS_UPDATE" as AuditActionType,
 targetType: "SystemSetting",
 targetId: GLOBAL_SETTINGS_ID,
 details: JSON.stringify({ changedField: "appName", oldValue: "OldName", newValue: "EvalTrack Pro" }),
 },
    });
  }
  if (supervisorUserIdForLog && firstEmployeeForGoal && createdUsersMap[firstEmployeeForGoal.id]) {
    const targetPerformanceScore = originalMockPerformanceScores.find(score => score.employeeId === firstEmployeeForGoal.id);
     await prisma.auditLog.create({
      data: {
        userId: supervisorUserIdForLog,
        action: "PERFORMANCE_SCORE_CREATED" as AuditActionType, // Added missing action
        targetType: "PerformanceScore", // Added targetType
        targetId: targetPerformanceScore?.id || 'N/A', // Use an actual mock ID if available
        details: JSON.stringify({ employeeEvaluated: firstEmployeeForGoal.name }) // Stringified details
      }
    });
  }
   await prisma.auditLog.create({
      data: {
        action: "SYSTEM_STARTUP" as AuditActionType,
      } as any // Cast to any for now, will fix prisma schema
    });
  console.log('Seeded audit logs.');

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
