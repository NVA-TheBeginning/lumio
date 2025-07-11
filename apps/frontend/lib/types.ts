export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export enum CriterionType {
  DELIVERABLE = "DELIVERABLE",
  REPORT = "REPORT",
  PRESENTATION = "PRESENTATION",
}

export interface CreateCriteriaDto {
  name: string;
  weight: number;
  type: CriterionType;
  individual: boolean;
}

export interface UpdateCriteriaDto {
  name?: string;
  weight?: number;
  type?: CriterionType;
  individual?: boolean;
}

export interface Criteria {
  id: number;
  name: string;
  weight: number;
  type: CriterionType;
  individual: boolean;
  projectId: number;
  promotionId: number;
  createdAt: string;
  updatedAt: string;
}
