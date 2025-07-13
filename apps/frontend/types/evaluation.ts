export interface FinalGrade {
  id: number;
  projectId: number;
  promotionId: number;
  groupId: number;
  finalGrade: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
