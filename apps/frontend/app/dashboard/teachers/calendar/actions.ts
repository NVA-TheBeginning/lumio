"use server";
import { authFetchData } from "@/lib/utils";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export interface CalendarDeliverable {
  id: number;
  projectId: number;
  promotionId: number;
  name: string;
  description?: string;
  deadline: string;
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number;
  type: string[];
  createdAt: string;
}

export interface CalendarProject {
  projectId: number;
  projectName: string;
  projectDescription: string;
  deliverables: CalendarDeliverable[];
}

export interface CalendarPromotion {
  promotionId: number;
  promotionName: string;
  projects: CalendarProject[];
}

export interface CalendarParams {
  promotionId?: number;
  startDate?: string;
  endDate?: string;
  projectId?: number;
}

export async function getCalendarDeliverables(params?: CalendarParams): Promise<CalendarPromotion[]> {
  const queryParams = new URLSearchParams();

  if (params?.promotionId) queryParams.append("promotionId", params.promotionId.toString());
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.projectId) queryParams.append("projectId", params.projectId.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/calendar${queryString ? `?${queryString}` : ""}`;

  return await authFetchData<CalendarPromotion[]>(url);
}

export async function getPromotions() {
  return await authFetchData<Array<{ id: number; name: string; description: string }>>(`${API_URL}/promotions`);
}
