"use server";

import { revalidatePath } from "next/cache";

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
  firstName: string;
  lastName: string;
  email: string;
  promotionId: number;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function getPromotions(): Promise<Promotion[]> {
  try {
    const response = await fetch(`${API_URL}/promotions`);
    if (!response.ok) {
      throw new Error("Failed to fetch promotions");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
}

export async function getPromotion(id: number): Promise<Promotion | null> {
  try {
    const response = await fetch(`${API_URL}/promotions/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch promotion with id ${id}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching promotion ${id}:`, error);
    return null;
  }
}

export async function getPromotionMembers(promotionId: number): Promise<Member[]> {
  try {
    const response = await fetch(`${API_URL}/promotions/${promotionId}/members`);
    if (!response.ok) {
      return [];
      // TODO: Uncomment the line below to throw an error when the backend will be ready
      //throw new Error(`Failed to fetch members for promotion ${promotionId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching members for promotion ${promotionId}:`, error);
    return [];
  }
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
  const response = await fetch(`${API_URL}/promotions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete promotion with id ${id}`);
  }
}

export async function removeMember(promotionId: number, memberId: number): Promise<void> {
  const response = await fetch(`${API_URL}/promotions/${promotionId}/student/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to remove member with id ${memberId} from promotion ${promotionId}`);
  }

  revalidatePath(`/dashboard/promotions/${promotionId}`);
}
