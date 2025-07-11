"use server";

import { authFetchData } from "@/lib/utils";
import type { Report } from "@/types/report";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

interface ReportFilters {
  projectId?: number;
  groupId?: number;
  promotionId?: number;
}

export async function getReport(id: number): Promise<Report> {
  return await authFetchData<Report>(`${API_BASE_URL}/reports/${id}`);
}

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
  try {
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

    const queryString = queryParts.join("&");
    const url = `${API_BASE_URL}/reports${queryString ? `?${queryString}` : ""}`;
    return await authFetchData<Report[]>(url);
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}
