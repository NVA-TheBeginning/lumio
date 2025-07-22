export interface DashboardStatistics {
  totalProjects: number;
  activeProjects: number;
  draftProjects: number;
  hiddenProjects: number;
  totalPromotions: number;
  participantProjects?: number;
  groupMemberships?: number;
}

export interface ActivityItem {
  id: number;
  type: "submission" | "project_created" | "project_updated" | "deliverable_created";
  title: string;
  description?: string;
  date: string;
  projectName?: string;
  status?: string;
}

export type UserRole = "TEACHER" | "ADMIN" | "STUDENT";
