"use server";

import { authFetchData } from "@/lib/utils";
import type { Report, ReportWithDetails } from "@/types/report";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

interface GroupType {
  id: number;
  name: string;
  members: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  }[];
}

interface ReportFilters {
  projectId?: number;
  groupId?: number;
  promotionId?: number;
}

export async function getReport(id: number): Promise<Report> {
  return await authFetchData<Report>(`${API_BASE_URL}/reports/${id}`);
}

export async function getReports(filters?: ReportFilters): Promise<ReportWithDetails[]> {
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
    const reports = await authFetchData<Report[]>(url);

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const [projectData, groupsData] = await Promise.all([
          authFetchData<{ id: number; name: string; promotions: { id: number; name: string }[] }>(
            `${API_BASE_URL}/projects/${report.projectId}/teacher`,
          ).catch(() => null),
          authFetchData<GroupType[]>(
            `${API_BASE_URL}/projects/${report.projectId}/promotions/${report.promotionId}/groups`,
          ).catch(() => null),
        ]);

        const promotion = projectData?.promotions.find((p) => p.id === report.promotionId);
        const group = groupsData?.find((g) => g.id === report.groupId);

        return {
          ...report,
          project: projectData ? { id: projectData.id, name: projectData.name } : undefined,
          group: group,
          promotion: promotion,
        } as ReportWithDetails;
      }),
    );

    return reportsWithDetails;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}
