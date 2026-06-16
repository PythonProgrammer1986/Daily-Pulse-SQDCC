export type Status =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Blocked"
  | "On Hold";
export type Priority = "High" | "Medium" | "Low";
export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export interface HistoryEntry {
  timestamp: string;
  change: string;
}

export interface Comment {
  user: string;
  timestamp: string;
  comment: string;
}

export interface Booking {
  id: string;
  date: string;
  userId: string;
  targetId: string; // Task or Project ID
  targetType: "task" | "project";
  hours: number;
  description: string;
}

export interface Task {
  id: string;
  category: string;
  task: string;
  owner: string;
  project: string;
  status: Status;
  priority: Priority;
  progress: number;
  hours: number; // Estimated hours
  startDate: string;
  dueDate: string;
  originalDueDate?: string;
  notes: string;
  okrLink?: string;
  keyResultLink?: string; // Linked specific KR ID
  ideaLink?: string;
  history: HistoryEntry[];
  comments: Comment[];
  updatedAt?: string;
  escalated?: boolean;
  escalationReason?: string;
}

export interface Project {
  id: string;
  name: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  hours: number; // Estimated hours
  description: string;
  progress?: number; // Manual % completion
  updatedAt?: string;
}

export interface Activity {
  id: string;
  date: string;
  person: string;
  activity: string;
  hours: number;
  status: "Completed" | "In Progress" | "Blocked";
  remarks: string;
  updatedAt?: string;
}

export interface KPIDailyLog {
  id: string;
  date: string;
  targetNumber?: number;
  actualNumber?: number;
  progress: number;
  remarks: string;
}

export interface KPI {
  id: string;
  name: string;
  target: string;
  targetNumber?: number;
  actualNumber?: number;
  completion: number;
  remarks: string;
  dailyLogs?: KPIDailyLog[];
  updatedAt?: string;
}

export interface Idea {
  id: string;
  idea: string;
  proposer: string;
  impact: "High" | "Low"; // Updated for Pick Chart
  cost: "High" | "Low"; // Updated for Pick Chart
  status: "New" | "Under Review" | "Approved" | "Implemented" | "Rejected";
  date: string;
  updatedAt?: string;
}

export interface Kudos {
  id: string;
  from: string;
  to: string;
  reason: string;
  date: string;
  updatedAt?: string;
}

export interface KeyResult {
  id: string;
  kr: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  updatedAt?: string;
}

export interface User {
  name: string;
  capacity: number;
}

export type SafetyStatusEntry = {
  status: "green" | "yellow" | "red";
  notes: string;
  ssqdcc_safety?: string;
  ssqdcc_sustainability?: string;
  ssqdcc_quality?: string;
  ssqdcc_delivery?: string;
  ssqdcc_cost?: string;
  ssqdcc_capital?: string;
  updatedAt?: string;
};
export type SafetyStatus = Record<string, SafetyStatusEntry>;

export interface ProductionPreparationItem {
  id: string;
  moReceivedDate: string;
  moNo: string;
  rev: string;
  moDetails: string;
  specialRequest: string;
  noOfMoBomLines: number | null;
  noOfIssuesWithMoBomLines: number | null;
  cnIdActive: string;
  tcMoBomCreationDate: string;
  m3MoBomCreationDate: string;
  status: "Active" | "Inactive" | "";
  cnIdInactive: string;
  date: string;
  remarks1: string;
  revisedMoBom: string;
  statusIndicator: string;
  odAction: string;
  bomReview: string;
  drawingNumber: string;
  sameSpecMo: string;
  preMoNumber: string;
  businessUnit: string;
  manualsForMt65: string;
  enginePartNumber: string;
  concernPart: string;
  phantomPurchase: string;
  noOfLine: string;
  responsibleFunction: string;
  remarks2: string;
  group: string;
  model: string;
  noMoOfBomRelease?: string;
  noOfTotalBomLines?: number | null;
  noOfErrorReported?: number | null;
  noOfActualErrorsBomLines?: number | null;
  remarks3?: string;
}

export interface PersistentItem {
  id: string;
  date: string;
  text: string;
  completed?: boolean;
  updatedAt?: string;
}

export interface ActiveLock {
  userId: string;
  timestamp: string;
}

export interface ArchivedItem {
  id: string;
  type: "Task" | "Project" | "Idea" | "Calendar" | "KPI";
  category?: string;
  item: any;
  archivedAt: string;
}

export interface AppState {
  version: string;
  tasks: Task[];
  archivedTasks?: Task[];
  archivedItems?: ArchivedItem[];
  projects: Project[];
  ideas: Idea[];
  kpis?: KPI[];
  kudos: Kudos[];
  okrs: OKR[];
  users: User[];
  bookings: Booking[];
  categories: string[];
  safetyStatus: SafetyStatus;
  dailyAgenda: Record<string, string>;
  lastBackupDate?: string;
  deletedItemIds?: string[]; // Tombstones for robust sync
  activeLocks?: Record<string, ActiveLock>; // itemId -> ActiveLock
  dailyFollowUp?: PersistentItem[]; // Persistent note across all calendar days
  ssqdcc_safety?: PersistentItem[];
  ssqdcc_sustainability?: PersistentItem[];
  ssqdcc_quality?: PersistentItem[];
  ssqdcc_delivery?: PersistentItem[];
  ssqdcc_cost?: PersistentItem[];
  ssqdcc_capital?: PersistentItem[];
  general_notes?: PersistentItem[];
  topic_monday?: PersistentItem[];
  topic_tuesday?: PersistentItem[];
  topic_wednesday?: PersistentItem[];
  topic_thursday?: PersistentItem[];
  topic_friday?: PersistentItem[];
  groups?: string[];
  models?: string[];
  productionPrepData?: ProductionPreparationItem[];
}
