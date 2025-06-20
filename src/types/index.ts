
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
  supervisor?: AppUser | null; // Populated by API include
  supervisedEmployees?: AppUser[]; // Populated by API include
  performanceScoresReceived?: PerformanceScore[]; // Populated by API include
  performanceScoresGiven?: PerformanceScore[]; // Populated by API include for evaluators
  workOutputs?: WorkOutput[]; // Populated by API include
  attendanceRecords?: AttendanceRecord[]; // Populated by API include
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight?: number | null; 
  performanceScores?: PerformanceScore[]; // Relation if needed
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

// This type might be less needed if assignments are just AppUser.supervisorId updates
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

    