"use server";

import { revalidatePath } from "next/cache";
import { getTokens, getUserFromCookie } from "@/lib/cookie";
import { authFetchData, authPostData } from "@/lib/utils";

export interface Promotion {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  promotionId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembersResponse {
  data: Member[];
  size: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function getPromotions(): Promise<Promotion[]> {
  const user = await getUserFromCookie();
  if (!user) {
    return [];
  }
  return await authFetchData<Promotion[]>(`${API_URL}/promotions?creatorId=${Number(user?.id)}`);
}
export async function getPromotion(id: number): Promise<Promotion> {
  return await authFetchData<Promotion>(`${API_URL}/promotions/${id}`);
}

export async function getPromotionMembers(promotionId: number, page = 1, size = 50): Promise<MembersResponse> {
  return await authFetchData<MembersResponse>(
    `${API_URL}/promotions/${promotionId}/students?page=${page}&size=${size}&all=false`,
  );
}

export async function createPromotion(data: {
  name: string;
  description: string;
  creatorId: number;
  students_csv: string;
}): Promise<Promotion> {
  const response = await fetch(`${API_URL}/promotions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create promotion");
  }

  revalidatePath("/dashboard/promotions");
  return await response.json();
}

export async function deletePromotion(id: number): Promise<void> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${API_URL}/promotions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete promotion with id ${id}`);
  }
}

export async function removeMember(promotionId: number, memberId: number): Promise<void> {
  const response = await fetch(`${API_URL}/promotions/${promotionId}/student`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentIds: [memberId] }),
  });

  if (!response.ok) {
    throw new Error(`Failed to remove member with id ${memberId} from promotion ${promotionId}`);
  }

  revalidatePath(`/dashboard/promotions/${promotionId}`);
}

export async function addMembers(
  promotionId: number,
  students: { lastname: string; firstname: string; email: string }[],
): Promise<void> {
  await authPostData(`${API_URL}/promotions/${promotionId}/student`, students);
  revalidatePath(`/dashboard/promotions/${promotionId}`);
}
