
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
import { format } from 'date-fns';

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
  await prisma.notification.deleteMany();
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

  // Create deterministic performance scores to show a trend
  const allEmployeeUsersWithMockData = mockAuthUsersWithPasswords.filter(u => u.role === 'EMPLOYEE');
  const allSupervisorUsersWithMockData = mockAuthUsersWithPasswords.filter(u => u.role === 'SUPERVISOR');
  const criteriaIds = Object.values(createdCriteria);
  const now = new Date();

  for (const employee of allEmployeeUsersWithMockData) {
      const employeeDbId = createdUsersMap[employee.id];
      if (!employeeDbId) continue;

      const evaluator = allSupervisorUsersWithMockData.find(s => s.id === employee.supervisorId) || allSupervisorUsersWithMockData[0];
      const evaluatorDbId = evaluator ? createdUsersMap[evaluator.id] : null;

      // Create a predictable trend of scores over the last 6 months
      for (let i = 0; i < 6; i++) {
          const evaluationDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
          // Give Employee Eve an improving score, others a stable score
          const scoreValue = employee.id === 'emp01' ? Math.min(5, 3 + Math.floor((5-i)/2)) : (i % 3) + 3;

          if (criteriaIds[i % criteriaIds.length]) {
              await prisma.performanceScore.create({
                  data: {
                      employeeId: employeeDbId,
                      criteriaId: criteriaIds[i % criteriaIds.length],
                      score: scoreValue,
                      comments: `Evaluation for ${format(evaluationDate, 'MMMM yyyy')}.`,
                      evaluationDate: evaluationDate,
                      evaluatorId: evaluatorDbId,
                  },
              });
          }
      }
  }
  console.log('Seeded deterministic performance scores.');

  // Create deterministic work outputs
  for (const employee of allEmployeeUsersWithMockData) {
    const employeeDbId = createdUsersMap[employee.id];
    if (employeeDbId) {
        for (let i = 1; i <= 2; i++) {
            const submissionDate = new Date(now.getFullYear(), now.getMonth() - i, 20);
            await prisma.workOutput.create({
                data: {
                    employeeId: employeeDbId,
                    title: `Project ${String.fromCharCode(65 + i)} Submission for ${employee.name}`,
                    description: `Monthly progress report submitted on ${format(submissionDate, 'PP')}.`,
                    fileUrl: `https://example.com/reports/${employee.id}/${submissionDate.getTime()}.pdf`,
                    submissionDate: submissionDate,
                },
            });
        }
    }
  }
  console.log('Seeded deterministic work outputs.');
  
  // Create deterministic attendance records
  const attendanceStatuses: AttendanceStatusType[] = ["PRESENT", "LATE", "PRESENT", "PRESENT", "ABSENT"]; // Skew towards present
  for (const employee of allEmployeeUsersWithMockData) {
      const employeeDbId = createdUsersMap[employee.id];
      if (employeeDbId) {
          const numberOfAttendanceRecords = 60; // Approx 3 months of weekdays
          for (let i = 0; i < numberOfAttendanceRecords; i++) {
              const attendanceDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
              // Skip weekends to be more realistic
              if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) continue;

              const status = attendanceStatuses[i % attendanceStatuses.length];
              await prisma.attendanceRecord.create({
                  data: {
                      employeeId: employeeDbId,
                      date: attendanceDate,
                      status: status,
                      notes: status !== 'PRESENT' ? `${status} on ${format(attendanceDate, 'PP')}` : '',
                  },
              });
          }
      }
  }
  console.log('Seeded deterministic attendance records.');

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
  const firstAdmin = mockAuthUsersWithPasswords.find(u => u.role === 'ADMIN');

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

  if (firstSupervisorForGoal && firstEmployeeForGoal) {
      await prisma.notification.create({
          data: {
              recipientId: createdUsersMap[firstEmployeeForGoal.id],
              actorId: createdUsersMap[firstSupervisorForGoal.id],
              message: 'assigned you a new goal: "Complete Project Alpha Q3"',
              link: '/goals',
              isRead: true
          }
      });
      await prisma.notification.create({
          data: {
              recipientId: createdUsersMap[firstEmployeeForGoal.id],
              actorId: createdUsersMap[firstSupervisorForGoal.id],
              message: 'left a performance review for you.',
              link: '/my-evaluations',
              isRead: false
          }
      });
  }
  if(firstAdmin) {
     await prisma.notification.create({
          data: {
              recipientId: createdUsersMap[firstAdmin.id],
              message: 'Welcome to EvalTrack! Check out the settings to get started.',
              link: '/admin/settings',
              isRead: false,
              actorId: createdUsersMap[firstAdmin.id] // A system notification can be "from" the admin.
          }
      });
  }
  console.log('Seeded notifications.');

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
