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

export interface MemberType {
  id: number;
  name: string;
}

export interface GroupType {
  id: number;
  name: string;
  members: MemberType[];
}

export interface GroupSettingsType {
  minMembers: number;
  maxMembers: number;
  mode: string;
  deadline: string;
}

export interface PromotionType {
  id: number;
  name: string;
  description: string;
  status: string;
  groupSettings: GroupSettingsType;
  groups: GroupType[];
}

export interface SubmissionType {
  groupId: number;
  status: string;
  submittedAt: string | null;
  grade: number | null;
}

export interface DeliverableType {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  promotionId: number;
  submissions: SubmissionType[];
}

export interface ProjectType {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
  promotions: PromotionType[];
  deliverables: DeliverableType[];
}
