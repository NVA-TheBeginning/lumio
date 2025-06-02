"use server";

import { authDeleteData, authFetchData, authPatchData, authPostData } from "@/lib/utils";
import type { CreateReportDto, Report, ReportSection, UpdateReportDto } from "@/types/report";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

export async function createReport(data: CreateReportDto): Promise<Report> {
  return authPostData<Report>(`${API_BASE_URL}/reports`, data);
}

export async function getReport(id: number): Promise<Report> {
  return authFetchData<Report>(`${API_BASE_URL}/reports/${id}`);
}

export async function getReports(filters?: {
  projectId?: number;
  groupId?: number;
  promotionId?: number;
}): Promise<Report[]> {
  const params = new URLSearchParams();
  if (filters?.projectId) params.append("projectId", filters.projectId.toString());
  if (filters?.groupId) params.append("groupId", filters.groupId.toString());
  if (filters?.promotionId) params.append("promotionId", filters.promotionId.toString());

  const url = `${API_BASE_URL}/reports${params.toString() ? `?${params.toString()}` : ""}`;
  console.log("Fetching reports from:", url);
  return authFetchData<Report[]>(url);
}

export async function updateReport(id: number, data: UpdateReportDto): Promise<Report> {
  return authPatchData<Report>(`${API_BASE_URL}/reports/${id}`, data);
}

export async function deleteReport(id: number): Promise<void> {
  return authDeleteData<void>(`${API_BASE_URL}/reports/${id}`);
}

export async function addReportSection(reportId: number, section: Omit<ReportSection, "id">): Promise<Report> {
  return authPostData<Report>(`${API_BASE_URL}/reports/${reportId}/sections`, section);
}

export async function updateReportSection(sectionId: number, section: Partial<ReportSection>): Promise<void> {
  return authPatchData<void>(`${API_BASE_URL}/reports/sections/${sectionId}`, section);
}

export async function deleteReportSection(sectionId: number): Promise<void> {
  return authDeleteData<void>(`${API_BASE_URL}/reports/sections/${sectionId}`);
}
