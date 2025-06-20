

export type UserRoleType = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string; // ISO date string
  avatarUrl?: string | null;
  role: UserRoleType; // This remains as a string literal union for TS type safety
  supervisorId?: string | null;
  supervisor?: AppUser | null; 
  supervisedEmployees?: AppUser[]; 
  performanceScoresReceived?: PerformanceScore[]; 
  performanceScoresGiven?: PerformanceScore[]; 
  workOutputs?: WorkOutput[]; 
  attendanceRecords?: AttendanceRecord[]; 
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

// This remains as a string literal union for TS type safety
export type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "ON_LEAVE";

export interface AttendanceRecord {
  id: string;
  employeeId: AppUser['id'];
  employee?: AppUser; 
  date: string; // ISO date string
  status: AttendanceStatusType; // This remains as a string literal union
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

// This remains as a string literal union for TS type safety
export type MessageEventType = 
  | "DEADLINE_APPROACHING"
  | "REVIEW_DUE"
  | "FEEDBACK_REQUEST"
  | "EVALUATION_COMPLETED"
  | "NEW_ASSIGNMENT";

export interface AutoMessageTrigger {
  id: string;
  eventName: MessageEventType; // This remains as a string literal union
  messageTemplate: string; 
  isActive: boolean;
  daysBeforeEvent?: number | null; 
}

export interface ChartDataPoint {
  name: string; 
  value: number;
  [key: string]: any; 
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: number; 
  description?: string;
}

    
