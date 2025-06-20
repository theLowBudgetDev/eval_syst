export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  supervisorId?: string;
  supervisorName?: string; // For display
  hireDate: string; // ISO date string
  avatarUrl?: string;
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight?: number; // Optional weight for scoring
}

export interface PerformanceScore {
  id: string;
  employeeId: string;
  criteriaId: string;
  score: number; // e.g., 1-5
  comments?: string;
  evaluationDate: string; // ISO date string
  evaluatorId: string; // Supervisor ID
}

export interface WorkOutput {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  fileUrl?: string; // URL to the attached file
  submissionDate: string; // ISO date string
}

export type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO date string
  status: AttendanceStatus;
  notes?: string;
}

export interface SupervisorAssignment {
  id: string;
  employeeId: string;
  employeeName?: string; // For display
  supervisorId: string;
  supervisorName?: string; // For display
  assignmentDate: string; // ISO date string
}

export type MessageEventType = 
  | "deadline_approaching"
  | "review_due"
  | "feedback_request"
  | "evaluation_completed"
  | "new_assignment";

export interface AutoMessageTrigger {
  id: string;
  eventName: MessageEventType;
  messageTemplate: string; // Can include placeholders like {{employeeName}}, {{deadlineDate}}
  isActive: boolean;
  daysBeforeEvent?: number; // For triggers like 'deadline_approaching'
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
