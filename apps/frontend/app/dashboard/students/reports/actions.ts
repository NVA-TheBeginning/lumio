"use server";

import { getUserFromCookie } from "@/lib/cookie";
import { authDeleteData, authFetchData, authPatchData, authPostData } from "@/lib/utils";
import type { CreateReportDto, Report, ReportSection, UpdateReportDto } from "@/types/report";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

export async function createReport(data: CreateReportDto): Promise<Report> {
  return await authPostData<Report>(`${API_BASE_URL}/reports`, data);
}

export async function getReport(id: number): Promise<Report> {
  return await authFetchData<Report>(`${API_BASE_URL}/reports/${id}`);
}
interface ReportFilters {
  projectId?: number;
  groupId?: number;
  promotionId?: number;
}

async function getStudentGroupIds(): Promise<number[]> {
  try {
    const response = await authFetchData<{
      data: Array<{ id: number; group?: { id: number } | null }>;
    }>(`${API_BASE_URL}/projects/myprojects?page=1&size=100`);

    return response.data
      .filter((project) => project.group?.id)
      .map((project) => project.group?.id)
      .filter((id): id is number => id !== undefined);
  } catch (error) {
    console.error("Error fetching student groups:", error);
    return [];
  }
}

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
  try {
    const user = await getUserFromCookie();
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const [studentGroupIds, allReports] = await Promise.all([getStudentGroupIds(), fetchAllReports(filters)]);

    if (studentGroupIds.length === 0) {
      return [];
    }

    return allReports.filter((report) => {
      return studentGroupIds.includes(report.groupId);
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}

async function fetchAllReports(filters?: ReportFilters): Promise<Report[]> {
  const queryParts: string[] = [];

  if (filters?.projectId != null && filters.projectId !== 0) {
    queryParts.push(`projectId=${encodeURIComponent(filters.projectId.toString())}`);
  }
  if (filters?.groupId != null && filters.groupId !== 0) {
    queryParts.push(`groupId=${encodeURIComponent(filters.groupId.toString())}`);
  }
  if (filters?.promotionId != null && filters.promotionId !== 0) {
    queryParts.push(`promotionId=${encodeURIComponent(filters.promotionId.toString())}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const url = `${API_BASE_URL}/reports${queryString}`;
  return await authFetchData<Report[]>(url);
}

export async function updateReport(id: number, data: UpdateReportDto): Promise<Report> {
  return await authPatchData<Report>(`${API_BASE_URL}/reports/${id}`, data);
}

export async function deleteReport(id: number): Promise<void> {
  await authDeleteData(`${API_BASE_URL}/reports/${id}`);
}

export async function addReportSection(reportId: number, section: Omit<ReportSection, "id">): Promise<Report> {
  return await authPostData<Report>(`${API_BASE_URL}/reports/${reportId}/sections`, section);
}

export async function updateReportSection(sectionId: number, section: Partial<ReportSection>): Promise<void> {
  await authPatchData(`${API_BASE_URL}/reports/sections/${sectionId}`, section);
}

export async function deleteReportSection(sectionId: number): Promise<void> {
  await authDeleteData(`${API_BASE_URL}/reports/sections/${sectionId}`);
}
