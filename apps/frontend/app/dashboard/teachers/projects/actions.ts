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

interface GroupType {
  id: number;
  name: string;
  members: {
    id: number;
    name: string;
  }[];
}

interface GroupSettingsType {
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

interface SubmissionType {
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

interface PromotionDto {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface getProjectTeacher {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  promotions: PromotionDto[];
}

export interface ProjectType {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  promotions: PromotionType[];
  deliverables: DeliverableType[];
}

export async function getProjectById(id: number): Promise<ProjectType> {
  const data = await authFetchData<getProjectTeacher>(`${API_URL}/projects/${id}/teacher`);

  if (!data) {
    throw new Error(`Project with ID ${id} not found`);
  }

  const result: ProjectType = {
    id: data.id,
    name: data.name,
    description: data.description,
    creatorId: data.creatorId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt,
    promotions: [],
    deliverables: [],
  };

  result.deliverables = await authFetchData<DeliverableType[]>(`${API_URL}/projects/${id}/deliverables`);

  const promotionPromises = data.promotions.map(async (promotion) => {
    // TODO: create a single route to fetch both group settings and groups
    const [groupSettings, groups] = await Promise.all([
      authFetchData<GroupSettingsType>(`${API_URL}/projects/${id}/promotions/${promotion.id}/group-settings`),
      authFetchData<GroupType[]>(`${API_URL}/projects/${id}/promotions/${promotion.id}/groups`),
    ]);

    return {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      status: promotion.status,
      groupSettings: {
        projectId: id,
        promotionId: groupSettings.promotionId,
        minMembers: groupSettings.minMembers,
        maxMembers: groupSettings.maxMembers,
        mode: groupSettings.mode,
        deadline: groupSettings.deadline,
        updatedAt: groupSettings.updatedAt,
      },
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        members: group.members.map((member: { id: number; name: string }) => ({
          id: member.id,
          name: member.name,
        })),
      })),
    };
  });

  result.promotions = await Promise.all(promotionPromises);

  return result;
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
