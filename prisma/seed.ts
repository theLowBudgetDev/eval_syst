import { PrismaClient, UserRole, AttendanceStatus, MessageEventType } from '@prisma/client';
import { mockAuthUsers } from '../src/contexts/AuthContext'; // Adjusted path
import {
  mockEvaluationCriteria,
  mockPerformanceScores as originalMockPerformanceScores,
  mockWorkOutputs as originalMockWorkOutputs,
  mockAttendanceRecords as originalMockAttendanceRecords,
  mockAutoMessageTriggers,
} from '../src/lib/mockData'; // Adjusted path

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data
  await prisma.performanceScore.deleteMany();
  await prisma.workOutput.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.autoMessageTrigger.deleteMany();
  await prisma.evaluationCriteria.deleteMany();
  // For User, we need to be careful due to self-relations.
  // Easiest to delete supervised users first if any constraint issues.
  // Or, temporarily disable foreign key checks if DB supports, then re-enable.
  // For SQLite, it's often fine to delete in order if relations are set up with cascades or NoAction.
  // Let's try deleting users with supervisorId set first.
  await prisma.user.deleteMany({ where: { supervisorId: { not: null } } });
  await prisma.user.deleteMany({ where: { supervisorId: null } });


  // Seed Users
  // We need to create supervisors first, then employees who report to them.
  const supervisorUsers = mockAuthUsers.filter(u => u.role === 'supervisor');
  const adminUsers = mockAuthUsers.filter(u => u.role === 'admin');
  const employeeUsers = mockAuthUsers.filter(u => u.role === 'employee');

  const createdSupervisors: { [key: string]: string } = {}; // oldId: newId
  for (const user of supervisorUsers) {
    const created = await prisma.user.create({
      data: {
        id: user.id, // Use mock ID for simplicity in seeding
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        hireDate: new Date(user.hireDate),
        avatarUrl: user.avatarUrl,
        role: user.role.toUpperCase() as UserRole,
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
        role: user.role.toUpperCase() as UserRole,
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
        role: user.role.toUpperCase() as UserRole,
        supervisorId: supervisorDbId,
      },
    });
     console.log(`Created employee with id: ${created.id} (original: ${user.id}), supervisorId: ${supervisorDbId || 'N/A'}`);
  }


  // Seed Evaluation Criteria
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

  // Seed Performance Scores
  for (const score of originalMockPerformanceScores) {
    // Ensure employeeId, criteriaId, and evaluatorId exist in the User and EvaluationCriteria tables
    const employeeExists = await prisma.user.findUnique({ where: { id: score.employeeId } });
    const criteriaExists = await prisma.evaluationCriteria.findUnique({ where: { id: score.criteriaId } });
    const evaluatorExists = await prisma.user.findUnique({ where: { id: score.evaluatorId } });

    if (employeeExists && criteriaExists && evaluatorExists) {
      await prisma.performanceScore.create({
        data: {
          // id: score.id, // Let Prisma generate this
          employeeId: score.employeeId,
          criteriaId: score.criteriaId,
          score: score.score,
          comments: score.comments,
          evaluationDate: new Date(score.evaluationDate),
          evaluatorId: score.evaluatorId,
        },
      });
    } else {
      console.warn(`Skipping performance score due to missing foreign key: emp-${!!employeeExists}, crit-${!!criteriaExists}, eval-${!!evaluatorExists} for mock score ${score.id}`);
    }
  }
  console.log('Seeded performance scores.');

  // Seed Work Outputs
  for (const output of originalMockWorkOutputs) {
    const employeeExists = await prisma.user.findUnique({ where: { id: output.employeeId } });
    if (employeeExists) {
      await prisma.workOutput.create({
        data: {
          // id: output.id, // Let Prisma generate this
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

  // Seed Attendance Records
  for (const record of originalMockAttendanceRecords) {
     const employeeExists = await prisma.user.findUnique({ where: { id: record.employeeId } });
     if (employeeExists) {
        let prismaStatus: AttendanceStatus;
        switch (record.status) {
            case "Present": prismaStatus = AttendanceStatus.PRESENT; break;
            case "Absent": prismaStatus = AttendanceStatus.ABSENT; break;
            case "Late": prismaStatus = AttendanceStatus.LATE; break;
            case "On Leave": prismaStatus = AttendanceStatus.ON_LEAVE; break;
            default: 
                console.warn(`Unknown attendance status: ${record.status}. Defaulting to ABSENT.`);
                prismaStatus = AttendanceStatus.ABSENT; 
                break;
        }
        await prisma.attendanceRecord.create({
            data: {
            // id: record.id, // Let Prisma generate this
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

  // Seed Auto Message Triggers
  for (const trigger of mockAutoMessageTriggers) {
    let prismaEventName: MessageEventType;
    switch (trigger.eventName) {
        case "deadline_approaching": prismaEventName = MessageEventType.DEADLINE_APPROACHING; break;
        case "review_due": prismaEventName = MessageEventType.REVIEW_DUE; break;
        case "feedback_request": prismaEventName = MessageEventType.FEEDBACK_REQUEST; break;
        case "evaluation_completed": prismaEventName = MessageEventType.EVALUATION_COMPLETED; break;
        case "new_assignment": prismaEventName = MessageEventType.NEW_ASSIGNMENT; break;
        default:
            console.warn(`Unknown message event type: ${trigger.eventName}. Skipping trigger.`);
            continue;
    }
    await prisma.autoMessageTrigger.create({
      data: {
        // id: trigger.id, // Let Prisma generate this
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
