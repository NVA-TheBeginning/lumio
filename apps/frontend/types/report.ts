export interface ReportSection {
  id?: number;
  title: string;
  contentMarkdown?: string;
  contentHtml?: string;
  updatedAt?: Date;
}

export interface Report {
  id?: number;
  projectId: number;
  groupId: number;
  promotionId: number;
  sections: ReportSection[];
  submittedAt?: Date;
  updatedAt?: Date;
}

export interface CreateReportDto {
  projectId: number;
  groupId: number;
  promotionId: number;
  sections: {
    title: string;
    contentMarkdown?: string;
    contentHtml?: string;
  }[];
}

export interface UpdateReportDto {
  sections: {
    id: number;
    title?: string;
    contentMarkdown?: string;
    contentHtml?: string;
  }[];
}
