
import { PrismaClient } from '@prisma/client';
import type { UserRoleType, AttendanceStatusType, MessageEventType, GoalStatusType, AuditActionType, SystemSetting } from '../src/types';
import { mockAuthUsers as originalMockAuthUsersConfig } from '../src/contexts/AuthContext';
import {
  mockEvaluationCriteria,
  mockPerformanceScores as originalMockPerformanceScores,
  mockWorkOutputs as originalMockWorkOutputs,
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

  for (const score of originalMockPerformanceScores) {
    const employeeDbId = createdUsersMap[score.employeeId];
    const criteriaDbId = createdCriteria[score.criteriaId];
    const evaluatorDbId = score.evaluatorId ? createdUsersMap[score.evaluatorId] : null;

    if (employeeDbId && criteriaDbId && (evaluatorDbId || !score.evaluatorId)) {
      await prisma.performanceScore.create({
        data: {
          employeeId: employeeDbId,
          criteriaId: criteriaDbId,
          score: score.score,
          comments: score.comments,
          evaluationDate: new Date(score.evaluationDate),
          evaluatorId: evaluatorDbId,
        },
      });
    } else {
      console.warn(`Skipping performance score due to missing DB ID: emp-${!!employeeDbId}, crit-${!!criteriaDbId}, eval-${!!evaluatorDbId || !score.evaluatorId} for mock score ID ${score.id || 'N/A'}`);
    }
  }
  console.log('Seeded performance scores.');

  for (const output of originalMockWorkOutputs) {
    const employeeDbId = createdUsersMap[output.employeeId];
    if (employeeDbId) {
      await prisma.workOutput.create({
        data: {
          employeeId: employeeDbId,
          title: output.title,
          description: output.description,
          fileUrl: output.fileUrl,
          submissionDate: new Date(output.submissionDate),
        },
      });
    } else {
         console.warn(`Skipping work output for mock employeeId ${output.employeeId} as user DB ID not found.`);
    }
  }
  console.log('Seeded work outputs.');

  for (const record of originalMockAttendanceRecords) {
     const employeeDbId = createdUsersMap[record.employeeId];
     if (employeeDbId) {
        const prismaStatus: AttendanceStatusType = record.status as AttendanceStatusType;
        if (!["PRESENT", "ABSENT", "LATE", "ON_LEAVE"].includes(prismaStatus)) {
             console.warn(`Unknown attendance status: ${record.status}. Skipping record.`);
            continue;
        }
        await prisma.attendanceRecord.create({
            data: {
            employeeId: employeeDbId,
            date: new Date(record.date),
            status: prismaStatus,
            notes: record.notes,
            },
        });
     } else {
         console.warn(`Skipping attendance record for mock employeeId ${record.employeeId} as user DB ID not found.`);
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
        details: JSON.stringify({ ipAddress: "192.168.1.100", userAgent: "Chrome/90.0" })
      }
    });
    await prisma.auditLog.create({
      data: {
        userId: adminUserIdForLog,
        action: "SYSTEM_SETTINGS_UPDATE" as AuditActionType,
        targetType: "SystemSetting",
        targetId: GLOBAL_SETTINGS_ID,
        details: JSON.stringify({ changedField: "appName", oldValue: "OldName", newValue: "EvalTrack Pro" })
      }
    });
  }
  if (supervisorUserIdForLog && firstEmployeeForGoal && createdUsersMap[firstEmployeeForGoal.id]) {
     await prisma.auditLog.create({
      data: {
        userId: supervisorUserIdForLog,
        action: "EVALUATION_CREATE" as AuditActionType,
        targetType: "PerformanceScore",
        targetId: "mockScoreId1_from_seed", // Use a more descriptive mock ID
        details: JSON.stringify({ employeeEvaluated: firstEmployeeForGoal.name })
      }
    });
  }
   await prisma.auditLog.create({
      data: {
        action: "SYSTEM_STARTUP" as AuditActionType,
        details: JSON.stringify({ message: "System initialized successfully during seed." })
      }
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
