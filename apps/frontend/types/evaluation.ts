export interface FinalGrade {
  id: number;
  projectId: number;
  promotionId: number;
  groupId: number;
  studentId: number;
  finalGrade: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
