"use client";

import { getTokens, getUserFromCookie } from "@/lib/cookie";
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

export async function getProjectById(id: number): Promise<ProjectType> {
  const data = await authFetchData(`${API_URL}/projects/${id}`);

  if (!data) {
    throw new Error(`Project with ID ${id} not found`);
  }

  const baseProject = data as Omit<ProjectType, "promotions" | "deliverables">;

  const mockPromotions: PromotionType[] = [
    {
      id: 101,
      name: "Promotion 2025",
      description: "Étudiants de la promotion 2025",
      status: "active",
      groupSettings: { minMembers: 3, maxMembers: 5, mode: "manual", deadline: "2025-12-31T23:59:59Z" },
      groups: [
        {
          id: 201,
          name: "Groupe Alpha",
          members: [
            { id: 301, name: "Alice Smith" },
            { id: 302, name: "Bob Johnson" },
          ],
        },
        { id: 202, name: "Groupe Beta", members: [{ id: 303, name: "Charlie Brown" }] },
      ],
    },
    {
      id: 102,
      name: "Promotion 2026",
      description: "Étudiants de la promotion 2026",
      status: "active",
      groupSettings: { minMembers: 2, maxMembers: 4, mode: "auto", deadline: "2026-12-31T23:59:59Z" },
      groups: [],
    },
  ];

  const mockDeliverables: DeliverableType[] = [
    {
      id: 401,
      title: "Rapport initial",
      description: "Soumission du rapport de cadrage du projet.",
      deadline: "2025-06-15T23:59:59Z",
      status: "due",
      promotionId: 101,
      submissions: [{ groupId: 201, status: "submitted", submittedAt: "2025-06-14T10:00:00Z", grade: null }],
    },
    {
      id: 402,
      title: "Démonstration finale",
      description: "Démonstration du projet fonctionnel.",
      deadline: "2025-08-30T23:59:59Z",
      status: "upcoming",
      promotionId: 101,
      submissions: [],
    },
    {
      id: 403,
      title: "Présentation",
      description: "Présentation orale des résultats.",
      deadline: "2025-09-15T23:59:59Z",
      status: "upcoming",
      promotionId: 102,
      submissions: [],
    },
  ];

  const projectWithMocks: ProjectType = {
    ...baseProject,
    promotions: mockPromotions,
    deliverables: mockDeliverables,
  };

  return projectWithMocks;
}

export async function deleteProject(id: number): Promise<void> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
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
