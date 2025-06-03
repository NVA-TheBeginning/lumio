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
interface ReportFilters {
  projectId?: number;
  groupId?: number;
  promotionId?: number;
}

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
  try {
    const queryParts: string[] = [];
    if (filters?.projectId) {
      queryParts.push(`projectId=${encodeURIComponent(filters.projectId.toString())}`);
    }
    if (filters?.groupId) {
      queryParts.push(`groupId=${encodeURIComponent(filters.groupId.toString())}`);
    }
    if (filters?.promotionId) {
      queryParts.push(`promotionId=${encodeURIComponent(filters.promotionId.toString())}`);
    }

    const queryString = queryParts.join("&");
    const url = `${API_BASE_URL}/reports${queryString ? `?${queryString}` : ""}`;
    return await authFetchData<Report[]>(url);
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}

export async function updateReport(id: number, data: UpdateReportDto): Promise<Report> {
  return await authPatchData<Report>(`${API_BASE_URL}/reports/${id}`, data);
}

export async function deleteReport(id: number): Promise<void> {
  return await authDeleteData<void>(`${API_BASE_URL}/reports/${id}`);
}

export async function addReportSection(reportId: number, section: Omit<ReportSection, "id">): Promise<Report> {
  return await authPostData<Report>(`${API_BASE_URL}/reports/${reportId}/sections`, section);
}

export async function updateReportSection(sectionId: number, section: Partial<ReportSection>): Promise<void> {
  return await authPatchData<void>(`${API_BASE_URL}/reports/sections/${sectionId}`, section);
}

export async function deleteReportSection(sectionId: number): Promise<void> {
  return await authDeleteData<void>(`${API_BASE_URL}/reports/sections/${sectionId}`);
}
