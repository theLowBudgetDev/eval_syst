
export type UserRoleType = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string; // ISO date string
  avatarUrl?: string | null; // Allow null
  role: UserRoleType;
  supervisorId?: string | null;
  supervisor?: AppUser | null;
  supervisedEmployees?: AppUser[];
  // Relations for other data if fetched, e.g. performanceScores, workOutputs
  performanceScoresReceived?: PerformanceScore[];
  workOutputs?: WorkOutput[];
  attendanceRecords?: AttendanceRecord[];
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight?: number | null; // Optional weight for scoring
}

export interface PerformanceScore {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser; // For include
  criteriaId: EvaluationCriteria['id'];
  criteria?: EvaluationCriteria; // For include
  score: number; // e.g., 1-5
  comments?: string | null;
  evaluationDate: string; // ISO date string
  evaluatorId: AppUser['id'] | null; // Supervisor ID or null if evaluator deleted
  evaluator?: AppUser | null; // For include
}

export interface WorkOutput {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser; // For include
  title: string;
  description?: string | null;
  fileUrl?: string | null; // URL to the attached file
  submissionDate: string; // ISO date string
}

export type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "ON_LEAVE"; // Matches Prisma Enum

export interface AttendanceRecord {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser; // For include
  date: string; // ISO date string
  status: AttendanceStatusType;
  notes?: string | null;
}

// SupervisorAssignment might be redundant if assignment is just updating AppUser.supervisorId
// For now, keeping it as it might be used in specific assignment UI contexts
export interface SupervisorAssignment {
  id: string; // This might be the employeeId in practice if it's about an assignment action
  employeeId: AppUser['id'];
  employeeName?: string; // For display
  supervisorId: AppUser['id'] | null; // Can be null to unassign
  supervisorName?: string; // For display
  assignmentDate: string; // ISO date string
}

export type MessageEventType = 
  | "DEADLINE_APPROACHING"
  | "REVIEW_DUE"
  | "FEEDBACK_REQUEST"
  | "EVALUATION_COMPLETED"
  | "NEW_ASSIGNMENT"; // Matches Prisma Enum

export interface AutoMessageTrigger {
  id: string;
  eventName: MessageEventType;
  messageTemplate: string; // Can include placeholders like {{employeeName}}, {{deadlineDate}}
  isActive: boolean;
  daysBeforeEvent?: number | null; // For triggers like 'deadline_approaching'
}

// For charts
export interface ChartDataPoint {
  name: string; // e.g., month, quarter, category
  value: number;
  [key: string]: any; // For multi-series charts
}

// Example metric for dashboard
export interface DashboardMetric {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: number; // e.g., 5 for +5%, -2 for -2%
  description?: string;
}
