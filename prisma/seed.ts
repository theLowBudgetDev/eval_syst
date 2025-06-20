
import { PrismaClient } from '@prisma/client';
// UserRoleType, AttendanceStatusType, MessageEventType will be used from src/types
// as string literal unions, which are compatible with the String fields in Prisma.
import type { UserRoleType, AttendanceStatusType, MessageEventType } from '../src/types';
import { mockAuthUsers } from '../src/contexts/AuthContext'; 
import {
  mockEvaluationCriteria,
  mockPerformanceScores as originalMockPerformanceScores,
  mockWorkOutputs as originalMockWorkOutputs,
  mockAttendanceRecords as originalMockAttendanceRecords,
  mockAutoMessageTriggers,
} from '../src/lib/mockData'; 

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data
  await prisma.performanceScore.deleteMany();
  await prisma.workOutput.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.autoMessageTrigger.deleteMany();
  await prisma.evaluationCriteria.deleteMany();
  await prisma.user.deleteMany({ where: { supervisorId: { not: null } } });
  await prisma.user.deleteMany({ where: { supervisorId: null } });


  const supervisorUsers = mockAuthUsers.filter(u => u.role === 'SUPERVISOR');
  const adminUsers = mockAuthUsers.filter(u => u.role === 'ADMIN');
  const employeeUsers = mockAuthUsers.filter(u => u.role === 'EMPLOYEE');

  const createdSupervisors: { [key: string]: string } = {}; 
  for (const user of supervisorUsers) {
    const created = await prisma.user.create({
      data: {
        id: user.id, 
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role, // role is already 'SUPERVISOR' (string)
      },
    });
    createdSupervisors[user.id] = created.id;
    console.log(`Created supervisor with id: ${created.id} (original: ${user.id})`);
  }

  for (const user of adminUsers) {
     const created = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role, // role is already 'ADMIN' (string)
      },
    });
    console.log(`Created admin with id: ${created.id} (original: ${user.id})`);
  }
  
  for (const user of employeeUsers) {
    const supervisorDbId = user.supervisorId ? createdSupervisors[user.supervisorId] : undefined;
    if (user.supervisorId && !supervisorDbId) {
        console.warn(`Supervisor with mock ID ${user.supervisorId} for employee ${user.name} not found in created supervisors. Skipping supervisor assignment.`);
    }
    const created = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role, // role is already 'EMPLOYEE' (string)
        supervisorId: supervisorDbId,
      },
    });
     console.log(`Created employee with id: ${created.id} (original: ${user.id}), supervisorId: ${supervisorDbId || 'N/A'}`);
  }

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

  for (const score of originalMockPerformanceScores) {
    const employeeExists = await prisma.user.findUnique({ where: { id: score.employeeId } });
    const criteriaExists = await prisma.evaluationCriteria.findUnique({ where: { id: score.criteriaId } });
    const evaluatorExists = score.evaluatorId ? await prisma.user.findUnique({ where: { id: score.evaluatorId } }) : true; // Allow null evaluatorId

    if (employeeExists && criteriaExists && (evaluatorExists || !score.evaluatorId)) {
      await prisma.performanceScore.create({
        data: {
          employeeId: score.employeeId,
          criteriaId: score.criteriaId,
          score: score.score,
          comments: score.comments,
          evaluationDate: new Date(score.evaluationDate),
          evaluatorId: score.evaluatorId || null,
        },
      });
    } else {
      console.warn(`Skipping performance score due to missing foreign key: emp-${!!employeeExists}, crit-${!!criteriaExists}, eval-${evaluatorExists === true || (score.evaluatorId && !!evaluatorExists)} for mock score ${score.id}`);
    }
  }
  console.log('Seeded performance scores.');

  for (const output of originalMockWorkOutputs) {
    const employeeExists = await prisma.user.findUnique({ where: { id: output.employeeId } });
    if (employeeExists) {
      await prisma.workOutput.create({
        data: {
          employeeId: output.employeeId,
          title: output.title,
          description: output.description,
          fileUrl: output.fileUrl,
          submissionDate: new Date(output.submissionDate),
        },
      });
    } else {
         console.warn(`Skipping work output for employeeId ${output.employeeId} as user does not exist.`);
    }
  }
  console.log('Seeded work outputs.');

  for (const record of originalMockAttendanceRecords) {
     const employeeExists = await prisma.user.findUnique({ where: { id: record.employeeId } });
     if (employeeExists) {
        // The status from mockAttendanceRecords is already a string literal union, compatible with String field
        const prismaStatus: AttendanceStatusType = record.status as AttendanceStatusType; 
        if (!["PRESENT", "ABSENT", "LATE", "ON_LEAVE"].includes(prismaStatus)) {
             console.warn(`Unknown attendance status: ${record.status}. Defaulting to ABSENT.`);
            // prismaStatus = "ABSENT"; // Or skip
            continue;
        }
        await prisma.attendanceRecord.create({
            data: {
            employeeId: record.employeeId,
            date: new Date(record.date),
            status: prismaStatus,
            notes: record.notes,
            },
        });
     } else {
         console.warn(`Skipping attendance record for employeeId ${record.employeeId} as user does not exist.`);
     }
  }
  console.log('Seeded attendance records.');

  for (const trigger of mockAutoMessageTriggers) {
    // The eventName from mockAutoMessageTriggers is already a string literal union
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

