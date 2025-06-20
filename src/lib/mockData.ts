import type { Employee, Supervisor, EvaluationCriteria, PerformanceScore, SupervisorAssignment, AutoMessageTrigger, DashboardMetric, ChartDataPoint, AttendanceRecord, WorkOutput, AttendanceStatus } from '@/types';
import { Users, ClipboardList, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export const mockSupervisors: Supervisor[] = [
  { id: 'sup1', name: 'Dr. Eleanor Vance', email: 'eleanor.vance@example.com' },
  { id: 'sup2', name: 'Mr. Samuel Green', email: 'samuel.green@example.com' },
  { id: 'sup3', name: 'Ms. Olivia Chen', email: 'olivia.chen@example.com' },
];

export const mockEmployees: Employee[] = [
  { id: 'emp1', name: 'Alice Wonderland', email: 'alice.w@example.com', department: 'Engineering', position: 'Software Engineer', supervisorId: 'sup1', supervisorName: 'Dr. Eleanor Vance', hireDate: '2022-08-15', avatarUrl: 'https://placehold.co/100x100.png?text=AW' },
  { id: 'emp2', name: 'Bob The Builder', email: 'bob.b@example.com', department: 'Product', position: 'Product Manager', supervisorId: 'sup2', supervisorName: 'Mr. Samuel Green', hireDate: '2021-05-20', avatarUrl: 'https://placehold.co/100x100.png?text=BB' },
  { id: 'emp3', name: 'Charlie Brown', email: 'charlie.b@example.com', department: 'Marketing', position: 'Marketing Specialist', supervisorId: 'sup1', supervisorName: 'Dr. Eleanor Vance', hireDate: '2023-01-10' },
  { id: 'emp4', name: 'Diana Prince', email: 'diana.p@example.com', department: 'Engineering', position: 'Senior Software Engineer', supervisorId: 'sup2', supervisorName: 'Mr. Samuel Green', hireDate: '2020-03-01', avatarUrl: 'https://placehold.co/100x100.png?text=DP' },
  { id: 'emp5', name: 'Edward Scissorhands', email: 'edward.s@example.com', department: 'HR', position: 'HR Coordinator', supervisorId: 'sup3', supervisorName: 'Ms. Olivia Chen', hireDate: '2022-11-05' },
];

export const mockEvaluationCriteria: EvaluationCriteria[] = [
  { id: 'crit1', name: 'Technical Skills', description: 'Proficiency in required technical skills.', weight: 0.3 },
  { id: 'crit2', name: 'Communication', description: 'Effectiveness in communication.', weight: 0.2 },
  { id: 'crit3', name: 'Teamwork', description: 'Ability to collaborate with others.', weight: 0.2 },
  { id: 'crit4', name: 'Problem Solving', description: 'Skill in identifying and solving problems.', weight: 0.2 },
  { id: 'crit5', name: 'Proactiveness', description: 'Takes initiative and is self-motivated.', weight: 0.1 },
];

export const mockPerformanceScores: PerformanceScore[] = [
  { id: 'score1', employeeId: 'emp1', criteriaId: 'crit1', score: 4, evaluationDate: '2023-07-01', evaluatorId: 'sup1', comments: 'Excellent technical contributions.' },
  { id: 'score2', employeeId: 'emp1', criteriaId: 'crit2', score: 3, evaluationDate: '2023-07-01', evaluatorId: 'sup1', comments: 'Good communication, can be more concise.' },
  { id: 'score3', employeeId: 'emp2', criteriaId: 'crit1', score: 3, evaluationDate: '2023-06-15', evaluatorId: 'sup2' },
];

export const mockSupervisorAssignments: SupervisorAssignment[] = [
  { id: 'assign1', employeeId: 'emp1', employeeName: 'Alice Wonderland', supervisorId: 'sup1', supervisorName: 'Dr. Eleanor Vance', assignmentDate: '2022-08-15' },
  { id: 'assign2', employeeId: 'emp2', employeeName: 'Bob The Builder', supervisorId: 'sup2', supervisorName: 'Mr. Samuel Green', assignmentDate: '2021-05-20' },
];

export const mockAutoMessageTriggers: AutoMessageTrigger[] = [
  { id: 'msgTrig1', eventName: 'review_due', messageTemplate: 'Hi {{employeeName}}, your performance review is due on {{deadlineDate}}.', isActive: true, daysBeforeEvent: 7 },
  { id: 'msgTrig2', eventName: 'deadline_approaching', messageTemplate: 'Reminder: Project {{projectName}} deadline is approaching on {{deadlineDate}}.', isActive: false },
];

export const mockDashboardMetrics: DashboardMetric[] = [
  { title: 'Total Employees', value: mockEmployees.length, icon: Users, trend: 2, description: 'Last 30 days' },
  { title: 'Pending Evaluations', value: 5, icon: ClipboardList, trend: -1, description: 'Compared to last cycle' },
  { title: 'Overall Performance', value: '4.2/5', icon: TrendingUp, description: 'Average score' },
  { title: 'Attendance Issues', value: 1, icon: AlertTriangle, trend: 1, description: 'This week' },
];

export const mockPerformanceTrendData: ChartDataPoint[] = [
  { name: 'Jan', 'Avg Score': 3.8 },
  { name: 'Feb', 'Avg Score': 4.0 },
  { name: 'Mar', 'Avg Score': 4.1 },
  { name: 'Apr', 'Avg Score': 4.3 },
  { name: 'May', 'Avg Score': 4.2 },
  { name: 'Jun', 'Avg Score': 4.4 },
];

export const mockEvaluationDistributionData: ChartDataPoint[] = [
  { name: 'Below Expectations', value: 2 },
  { name: 'Meets Expectations', value: 15 },
  { name: 'Exceeds Expectations', value: 8 },
  { name: 'Outstanding', value: 3 },
];

const attendanceStatuses: AttendanceStatus[] = ["Present", "Absent", "Late", "On Leave"];
export const mockAttendanceRecords: AttendanceRecord[] = mockEmployees.flatMap(emp => 
  Array.from({ length: 5 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      id: `att-${emp.id}-${i}`,
      employeeId: emp.id,
      date: date.toISOString().split('T')[0],
      status: attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)],
      notes: Math.random() > 0.8 ? 'Late due to traffic' : undefined
    };
  })
);

export const mockWorkOutputs: WorkOutput[] = [
  { id: 'wo1', employeeId: 'emp1', title: 'Q2 Feature Implementation', submissionDate: '2023-06-28', description: 'Completed all tasks for the Q2 sprint.' },
  { id: 'wo2', employeeId: 'emp1', title: 'API Documentation', submissionDate: '2023-07-05', fileUrl: '#' },
  { id: 'wo3', employeeId: 'emp2', title: 'Product Roadmap Q3', submissionDate: '2023-06-30', description: 'Finalized product roadmap for next quarter.' },
];
