

export type UserRoleType = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string; // ISO date string
  avatarUrl?: string | null;
  role: UserRoleType;
  supervisorId?: string | null;
  supervisor?: AppUser | null;
  supervisedEmployees?: AppUser[];
  performanceScoresReceived?: PerformanceScore[];
  performanceScoresGiven?: PerformanceScore[];
  workOutputs?: WorkOutput[];
  attendanceRecords?: AttendanceRecord[];
  goalsAsEmployee?: Goal[];
  goalsAsSupervisor?: Goal[];
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight?: number | null;
  performanceScores?: PerformanceScore[];
}

export interface PerformanceScore {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser;
  criteriaId: EvaluationCriteria['id'];
  criteria?: EvaluationCriteria;
  score: number;
  comments?: string | null;
  evaluationDate: string; // ISO date string
  evaluatorId: AppUser['id'] | null;
  evaluator?: AppUser | null;
}

export interface WorkOutput {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  submissionDate: string; // ISO date string
}

export type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "ON_LEAVE";

export interface AttendanceRecord {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser;
  date: string; // ISO date string
  status: AttendanceStatusType;
  notes?: string | null;
}

export interface SupervisorAssignment {
  id: string;
  employeeId: AppUser['id'];
  employeeName?: string;
  supervisorId: AppUser['id'] | null;
  supervisorName?: string;
  assignmentDate: string; // ISO date string
}

export type MessageEventType =
  | "DEADLINE_APPROACHING"
  | "REVIEW_DUE"
  | "FEEDBACK_REQUEST"
  | "EVALUATION_COMPLETED"
  | "NEW_ASSIGNMENT";

export interface AutoMessageTrigger {
  id: string;
  eventName: MessageEventType;
  messageTemplate: string;
  isActive: boolean;
  daysBeforeEvent?: number | null;
}

export type GoalStatusType = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  status: GoalStatusType;
  dueDate?: string | null; // ISO date string
  employeeId: string;
  employee?: AppUser; // For including employee details
  supervisorId?: string | null;
  supervisor?: AppUser; // For including supervisor details
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}


export interface EvaluationDistributionPoint {
  name: string; 
  value: number; 
  fill?: string; 
  [key: string]: any;
}

export interface PerformanceTrendPoint {
  name: string; 
  "Avg Score": number | null; 
  [key: string]: any;
}


export interface DashboardMetric {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: number;
  description?: string;
}
