"use server";
import { getUserFromCookie } from "@/lib/cookie";
import { authDeleteData, authFetchData, authPatchData, authPostData, authPutData, PaginationMeta } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:3000";

interface Project {
  id: number;
  name: string;
  description: string;
  promotions: {
    id: number;
    name: string;
    status: "VISIBLE" | "DRAFT" | "HIDDEN" | string;
  }[];
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

interface CreateProjectData {
  name: string;
  description: string;
  creatorId: number;
  promotionIds: number[];
  groupSettings?: {
    promotionId: number;
    minMembers: number;
    maxMembers: number;
    mode: string;
    deadline: string;
  }[];
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
  projectId: number;
  promotionId: number;
  minMembers: number;
  maxMembers: number;
  mode: string;
  deadline: string;
  updatedAt: string;
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

export interface getAllStudentProjects {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  group: {
    id: number;
    name: string;
  } | null;
  promotion: {
    id: number;
    name: string;
  };
}

async function getUserId(): Promise<number> {
  const user = await getUserFromCookie();
  return Number(user?.id);
}

export async function getAllProjects(
  page: number,
  size: number,
): Promise<{ pagination: PaginationMeta; data: Project[] }> {
  return await authFetchData<{ pagination: PaginationMeta; data: Project[] }>(
    `${API_URL}/projects/myprojects?page=${page}&size=${size}`,
  );
}

export async function getAllStudentProjects(
  page: number,
  size: number,
): Promise<{ pagination: PaginationMeta; data: getAllStudentProjects[] }> {
  return await authFetchData<{ pagination: PaginationMeta; data: getAllStudentProjects[] }>(
    `${API_URL}/projects/myprojects?page=${page}&size=${size}`,
  );
}

export async function createProject(data: CreateProjectData): Promise<void> {
  data.creatorId = await getUserId();
  await authPostData(`${API_URL}/projects`, data);
}

export async function getProjectById(id: number): Promise<ProjectType> {
  const data = await authFetchData(`${API_URL}/projects/${id}`);

  if (!data) {
    throw new Error(`Project with ID ${id} not found`);
  }

  const mockPromoId = 1;
  const groupSettings = await authFetchData<GroupSettingsType>(
    `${API_URL}/projects/${id}/promotions/${mockPromoId}/group-settings`,
  );
  const groups = await authFetchData<GroupType[]>(`${API_URL}/projects/${id}/promotions/${mockPromoId}/groups`);

  const baseProject = data as Omit<ProjectType, "promotions" | "deliverables">;

  const mockPromotions: PromotionType[] = [
    {
      id: 1,
      name: "Promotion 2025",
      description: "Étudiants de la promotion 2025",
      status: "VISIBLE",
      groupSettings,
      groups,
    },
  ];
  console.log("mockPromotions", mockPromotions);

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
  return await authDeleteData(`${API_URL}/projects/${id}`);
}

export async function updateProjectStatus(
  idProject: number,
  idPromotion: number,
  status: "VISIBLE" | "DRAFT" | "HIDDEN" | string,
): Promise<void> {
  return await authPatchData<void>(`${API_URL}/projects/${idProject}/${idPromotion}/status`, { status });
}

export interface GroupSettingsUpdateDto {
  minMembers: number;
  maxMembers: number;
  mode: "MANUAL" | "RANDOM" | "FREE" | string;
  deadline: string;
}

export interface CreateGroupsDto {
  numberOfGroups: number;
  baseName?: string;
}

interface UpdateGroupDto {
  name: string;
}

export async function updateGroupSettings(projectId: number, promotionId: number, data: GroupSettingsUpdateDto) {
  return await authPatchData(`${API_URL}/projects/${projectId}/promotions/${promotionId}/group-settings`, data);
}

export async function createGroups(projectId: number, promotionId: number, data: CreateGroupsDto) {
  return await authPostData(`${API_URL}/projects/${projectId}/promotions/${promotionId}/groups`, data);
}

export async function updateGroup(groupId: number, data: UpdateGroupDto) {
  return await authPutData(`${API_URL}/groups/${groupId}`, data);
}

export async function deleteGroup(groupId: number) {
  return await authDeleteData(`${API_URL}/groups/${groupId}`);
}

export async function addMembersToGroup(groupId: number, studentIds: number[]) {
  return await authPostData(`${API_URL}/groups/${groupId}/students`, { studentIds });
}

export async function removeMemberFromGroup(groupId: number, userId: number) {
  return await authDeleteData(`${API_URL}/groups/${groupId}/students/${userId}`);
}
