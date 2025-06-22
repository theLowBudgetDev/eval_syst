

export type UserRoleType = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

// This AppUser type is for client-side use and API responses.
// It should NOT include sensitive fields like password hashes.
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
  supervisor?: AppUser | null; // Nested supervisor details
  supervisedEmployees?: AppUser[];
  performanceScoresReceived?: PerformanceScore[];
  performanceScoresGiven?: PerformanceScore[];
  workOutputs?: WorkOutput[];
  attendanceRecords?: AttendanceRecord[];
  goalsAsEmployee?: Goal[];
  goalsAsSupervisor?: Goal[];
  auditLogs?: AuditLog[];
  notifications?: Notification[];
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
  avgScore: number | null;
  [key: string]: any;
}


export interface DashboardMetric {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: number;
  description?: string;
}

export type AuditActionType =
  | "USER_LOGIN" | "USER_LOGOUT"
  | "USER_CREATE" | "USER_UPDATE" | "USER_DELETE"
  | "GOAL_CREATE" | "GOAL_UPDATE" | "GOAL_DELETE"
  | "EVALUATION_CREATE" | "EVALUATION_UPDATE" | "EVALUATION_DELETE"
  | "SETTINGS_UPDATE" | "ASSIGNMENT_UPDATE"
  | "TRIGGER_CREATE" | "TRIGGER_UPDATE" | "TRIGGER_DELETE"
  | "CRITERIA_CREATE" | "CRITERIA_UPDATE" | "CRITERIA_DELETE"
  | "ATTENDANCE_CREATE" | "ATTENDANCE_UPDATE" | "ATTENDANCE_DELETE"
  | "WORK_OUTPUT_CREATE" | "WORK_OUTPUT_UPDATE" | "WORK_OUTPUT_DELETE"
  | "SYSTEM_STARTUP" | "SYSTEM_SETTINGS_UPDATE"
  | "AUTH_LOGIN_SUCCESS" | "AUTH_LOGIN_FAILURE"
  | "AUTH_PASSWORD_CHANGE_SUCCESS" | "AUTH_PASSWORD_CHANGE_FAILURE"
  | "DATA_BACKUP_SUCCESS" | "DATA_BACKUP_FAILURE"
  | "BATCH_ASSIGNMENT_SUCCESS" | "BATCH_ASSIGNMENT_FAILURE"
  | "FEEDBACK_REQUESTED"
  | "NOTIFICATION_CREATED" | "NOTIFICATION_READ" | "NOTIFICATION_DELETED";


export interface AuditLog {
  id: string;
  timestamp: string; // ISO date string
  userId?: string | null;
  user?: AppUser; // User who performed the action
  action: AuditActionType;
  targetType?: string | null; // e.g., "User", "Goal", "EvaluationCriteria"
  targetId?: string | null; // ID of the entity affected
  details?: any | null; // JSON or string for additional context
}

export interface SystemSetting {
  id: string; // Should always be "global_settings"
  appName: string;
  systemTheme: string; // "light", "dark", "system"
  maintenanceMode: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string; // ISO date string
  recipientId: string;
  actorId?: string | null;
  actor?: {
    name: string;
    avatarUrl?: string | null;
  } | null;
}
