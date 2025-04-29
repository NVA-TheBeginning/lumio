"use client";

import { getUserFromCookie } from "@/lib/cookie";
import { authFetchData, authPostData } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:3000";

interface Project {
  id: number;
  name: string;
  description: string;
  promotions: string[];
  updatedAt: string;
  createdAt: string;
  deletedAt: string;
  status: "visible" | "draft" | "hidden";
}

interface CreateProjectData {
  name: string;
  description: string;
  creatorId: number;
  promotionIds: number[];
  groupSettings: {
    promotionId: number;
    minMembers: number;
    maxMembers: number;
    mode: string;
    deadline: string;
  }[];
}

async function getUserId(): Promise<number> {
  const user = await getUserFromCookie();
  return Number(user?.id);
}

export const getAllProjects = async (): Promise<{ projects: Project[]; promotions: string[] }> => {
  const id = await getUserId();
  const data = (await authFetchData(`${API_URL}/projects/creator/${id}`)) as Project[];
  for (const project of data) {
    project.promotions = ["randomPromotions"];
    project.status = "visible";
  }
  console.log("data", data);
  const promoSet = new Set<string>(data.flatMap((project) => project.promotions));
  return {
    projects: data,
    promotions: Array.from(promoSet),
  };
};

export async function createProject(data: CreateProjectData): Promise<void> {
  data.creatorId = await getUserId();
  await authPostData(`${API_URL}/projects`, data);
}
