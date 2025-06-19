"use server";
import { getUserFromCookie } from "@/lib/cookie";
import { authDeleteData, authFetchData, authPatchData, authPostData, authPutData, PaginationMeta } from "@/lib/utils";
import { Member, MembersResponse } from "../promotions/action";

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
    firstname: string;
    lastname: string;
    email: string;
    addedAt: string;
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

export interface DeliverableType {
  id: number;
  name: string;
  description?: string;
  deadline: string;
  status: string;
  promotionId: number;
  projectId: number;
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number;
  type: string[];
  createdAt: string;
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

export async function getProjectByIdTeacher(id: number): Promise<ProjectType> {
  const [projectData, deliverablesData] = await Promise.all([
    authFetchData<getProjectTeacher>(`${API_URL}/projects/${id}/teacher`),
    authFetchData<DeliverableType[]>(`${API_URL}/projects/${id}/deliverables`),
  ]);

  if (!projectData) {
    throw new Error(`Project with ID ${id} not found`);
  }

  const result: ProjectType = {
    id: projectData.id,
    name: projectData.name,
    description: projectData.description,
    creatorId: projectData.creatorId,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,
    deletedAt: projectData.deletedAt,
    promotions: [],
    deliverables: deliverablesData || [],
  };

  const promotionPromises = projectData.promotions.map(async (promotion) => {
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
        promotionId: promotion.id,
        minMembers: groupSettings?.minMembers ?? 1,
        maxMembers: groupSettings?.maxMembers ?? 10,
        mode: groupSettings?.mode ?? "MANUAL",
        deadline: groupSettings?.deadline ?? null,
        updatedAt: groupSettings?.updatedAt ?? new Date().toISOString(),
      },
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        members: group.members.map(
          (member: { id: number; firstname: string; lastname: string; email: string; addedAt: string }) => ({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            email: member.email,
            addedAt: member.addedAt,
          }),
        ),
      })),
    };
  });

  result.promotions = await Promise.all(promotionPromises);
  return result;
}

interface getProjectStudent {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  promotionId: number;
}

export interface ProjectStudentType {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  promotionId: number;
  groupSettings: {
    minMembers: number;
    maxMembers: number;
    mode: string;
    deadline: string;
  };
  groups: GroupType[];
  deliverables: DeliverableType[];
  submissions: {
    groupId: number;
    status: string;
    submittedAt: string | null;
    grade: number | null;
    deliverableId: number;
  }[];
}

export async function getProjectByIdStudent(id: number): Promise<ProjectStudentType> {
  const data = await authFetchData<getProjectStudent>(`${API_URL}/projects/${id}/student`);
  if (!data) {
    throw new Error(`Project with ID ${id} not found`);
  }

  const result: ProjectStudentType = {
    id: data.id,
    name: data.name,
    description: data.description,
    creatorId: data.creatorId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt,
    promotionId: data.promotionId,
    groupSettings: {
      minMembers: 0,
      maxMembers: 0,
      mode: "",
      deadline: "",
    },
    groups: [],
    deliverables: [],
    submissions: [],
  };

  const [deliverables, groupSettings, groups] = await Promise.all([
    authFetchData<DeliverableType[]>(`${API_URL}/projects/${id}/deliverables`),
    authFetchData<GroupSettingsType>(`${API_URL}/projects/${id}/promotions/${data.promotionId}/group-settings`),
    authFetchData<GroupType[]>(`${API_URL}/projects/${id}/promotions/${data.promotionId}/groups`),
  ]);

  result.deliverables = deliverables || [];
  result.submissions = [];
  result.groupSettings = groupSettings || {
    minMembers: 0,
    maxMembers: 0,
    mode: "",
    deadline: "",
  };

  if (groups) {
    result.groups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      members: group.members.map(
        (member: { id: number; firstname: string; lastname: string; email: string; addedAt: string }) => ({
          id: member.id,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          addedAt: member.addedAt,
        }),
      ),
    }));
  }

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
  try {
    await authPatchData<void>(`${API_URL}/projects/${idProject}/${idPromotion}/status`, { status });
  } catch (error) {
    if (!(error instanceof SyntaxError && error.message.includes("JSON Parse error"))) {
      throw error;
    }
  }
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

export async function randomizeStudentsToGroups(projectId: number, promotionId: number) {
  return await authPostData<unknown>(`${API_URL}/projects/${projectId}/promotions/${promotionId}/groups/randomize`, {});
}

export interface CreateDeliverableData {
  projectId: number;
  promotionId: number;
  name: string;
  description?: string;
  deadline: string;
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number;
  type: string[];
}

export interface UpdateDeliverableData {
  id: number;
  projectId: number;
  promotionId: number;
  name?: string;
  description?: string;
  deadline?: string;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  type: string[];
}

export async function createDeliverable(data: CreateDeliverableData): Promise<DeliverableType> {
  return await authPostData(`${API_URL}/projects/deliverables`, data);
}

export async function updateDeliverable(data: UpdateDeliverableData): Promise<DeliverableType> {
  return await authPutData(`${API_URL}/projects/deliverables`, data);
}

export async function deleteDeliverable(id: number): Promise<void> {
  return await authDeleteData(`${API_URL}/projects/deliverables/${id}`);
}

export async function getPromoStudent(promotionId: number): Promise<Member[]> {
  const response = await authFetchData<MembersResponse>(`${API_URL}/promotions/${promotionId}/students?all=true`);
  return response.data;
}
