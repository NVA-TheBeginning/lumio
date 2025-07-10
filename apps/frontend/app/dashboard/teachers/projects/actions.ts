"use server";
import { getTokens, getUserFromCookie } from "@/lib/cookie";
import {
  authDeleteData,
  authFetchData,
  authPatchData,
  authPostData,
  authPostFormData,
  authPutData,
  PaginationMeta,
} from "@/lib/utils";
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

export enum RuleType {
  SIZE_LIMIT = "SIZE_LIMIT",
  FILE_PRESENCE = "FILE_PRESENCE",
  DIRECTORY_STRUCTURE = "DIRECTORY_STRUCTURE",
}

export interface SizeLimitRuleDetails {
  maxSizeInBytes: number;
}

export interface FilePresenceRuleDetails {
  requiredFiles: string[];
  allowedExtensions?: string[];
  forbiddenExtensions?: string[];
}

export interface DirectoryStructureRuleDetails {
  requiredDirectories: string[];
  forbiddenDirectories?: string[];
}

export interface DeliverableRule {
  id: number;
  deliverableId: number;
  ruleType: RuleType;
  ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
}

export interface CreateRuleData {
  deliverableId: number;
  ruleType: RuleType;
  ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
}

export interface UpdateRuleData {
  ruleType?: RuleType;
  ruleDetails?: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
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
  documents: ProjectDocument[];
}

export async function getProjectByIdTeacher(id: number): Promise<ProjectType> {
  const [projectData, deliverablesData, documentsData] = await Promise.all([
    authFetchData<getProjectTeacher>(`${API_URL}/projects/${id}/teacher`),
    authFetchData<DeliverableType[]>(`${API_URL}/projects/${id}/deliverables`),
    authFetchData<ProjectDocument[]>(`${API_URL}/documents/projects/${id}`),
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
    documents: documentsData || [],
  };

  const promotionPromises = projectData.promotions.map(async (promotion) => {
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
  documents: ProjectDocument[];
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
    documents: [],
    submissions: [],
  };

  const [deliverables, groupSettings, groups, documents] = await Promise.all([
    authFetchData<DeliverableType[]>(`${API_URL}/projects/${id}/deliverables`),
    authFetchData<GroupSettingsType>(`${API_URL}/projects/${id}/promotions/${data.promotionId}/group-settings`),
    authFetchData<GroupType[]>(`${API_URL}/projects/${id}/promotions/${data.promotionId}/groups`),
    authFetchData<ProjectDocument[]>(`${API_URL}/documents/projects/${id}`),
  ]);

  result.deliverables = deliverables || [];
  result.documents = documents || [];
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
  await authDeleteData(`${API_URL}/projects/deliverables/${id}`);
}

export async function getPromoStudent(promotionId: number): Promise<Member[]> {
  const response = await authFetchData<MembersResponse>(`${API_URL}/promotions/${promotionId}/students?all=true`);
  return response.data;
}

export interface PresentationType {
  id: number;
  projectId: number;
  promotionId: number;
  startDatetime: string;
  endDatetime?: string;
  durationPerGroup: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderType {
  id: number;
  presentationId: number;
  groupId: number;
  orderNumber: number;
  scheduledDatetime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePresentationData {
  projectId: number;
  promotionId: number;
  startDatetime: string;
  endDatetime?: string;
  durationPerGroup: number;
}

export interface UpdatePresentationData {
  startDatetime?: string;
  endDatetime?: string;
  durationPerGroup?: number;
}

export interface SaveOrdersData {
  groupIds: number[];
}

export interface UpdateOrderData {
  groupId?: number;
  orderNumber?: number;
}

export async function createPresentation(data: CreatePresentationData): Promise<PresentationType> {
  return await authPostData(`${API_URL}/presentations/${data.projectId}/${data.promotionId}`, data);
}

export async function getPresentations(projectId: number, promotionId: number): Promise<PresentationType[]> {
  return await authFetchData(`${API_URL}/presentations/${projectId}/${promotionId}`);
}

export async function getPresentation(id: number): Promise<PresentationType> {
  return await authFetchData(`${API_URL}/presentations/${id}`);
}

export async function updatePresentation(id: number, data: UpdatePresentationData): Promise<PresentationType> {
  return await authPutData(`${API_URL}/presentations/${id}`, data);
}

export async function deletePresentation(id: number): Promise<void> {
  return await authDeleteData(`${API_URL}/presentations/${id}`);
}

export async function saveOrders(presentationId: number, data: SaveOrdersData): Promise<OrderType[]> {
  return await authPostData(`${API_URL}/presentations/${presentationId}/orders`, data);
}

export async function getOrders(presentationId: number): Promise<OrderType[]> {
  return await authFetchData(`${API_URL}/presentations/${presentationId}/orders`);
}

export async function updateOrder(id: number, data: UpdateOrderData): Promise<OrderType> {
  return await authPutData(`${API_URL}/orders/${id}`, data);
}

export async function deleteOrder(id: number): Promise<void> {
  return await authDeleteData(`${API_URL}/orders/${id}`);
}

export async function getSubmissionDownloadData(submissionId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_URL}/submissions/${submissionId}/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const contentDisposition = response.headers.get("content-disposition");
  let filename = `submission-${submissionId}.zip`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch?.[1]) {
      filename = filenameMatch[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

export interface PromotionSubmissionMetadataResponse {
  submissionId: number;
  deliverableId: number;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  submissionDate: Date;
  groupId: number;
  penalty: number;
  type: string[];
  status: string;
  lastModified: Date;
  gitUrl?: string;
  error?: boolean;
  plagiarismResult?: {
    folderName: string;
    sha1: string | null;
    plagiarismPercentage: number;
    matches: {
      matchedFolder: string;
      overallMatchPercentage: number;
      combinedScore: number;
      flags: string[];
    }[];
  };
}

export async function getAllPromotionSubmissions(
  promotionId: number,
  projectId?: number,
): Promise<PromotionSubmissionMetadataResponse[]> {
  const url = projectId
    ? `${API_URL}/promotions/${promotionId}/submissions?projectId=${projectId}`
    : `${API_URL}/promotions/${promotionId}/submissions`;
  return await authFetchData(url);
}

export async function acceptSubmission(submissionId: number): Promise<PromotionSubmissionMetadataResponse> {
  const url = `${API_URL}/submissions/${submissionId}/accept`;
  return await authPatchData(url, {});
}

export async function checkPlagiarism(
  projectId: string,
  promotionId: string,
  step: string,
): Promise<{
  projectId: string;
  promotionId: string;
  folderResults: {
    folderName: string;
    sha1: string | null;
    plagiarismPercentage: number;
    matches: {
      matchedFolder: string;
      overallMatchPercentage: number;
      combinedScore: number;
      flags: string[];
    }[];
  }[];
}> {
  return await authPostData(`${API_URL}/plagiarism/checks`, {
    projectId,
    promotionId,
    step,
  });
}

export async function getDeliverableRules(deliverableId: number): Promise<DeliverableRule[]> {
  const url = `${API_URL}/deliverables/${deliverableId}/rules`;
  return await authFetchData(url);
}

export async function createRule(ruleData: CreateRuleData): Promise<DeliverableRule> {
  const url = `${API_URL}/deliverables/rules`;
  return await authPostData(url, ruleData);
}

export async function updateRule(ruleId: number, ruleData: UpdateRuleData): Promise<DeliverableRule> {
  const url = `${API_URL}/rules/${ruleId}`;
  return await authPutData(url, ruleData);
}

export async function deleteRule(ruleId: number): Promise<void> {
  const url = `${API_URL}/rules/${ruleId}`;
  return await authDeleteData(url);
}

export async function getRule(ruleId: number): Promise<DeliverableRule> {
  const url = `${API_URL}/rules/${ruleId}`;
  return await authFetchData(url);
}

// Evaluation system types following existing patterns
export interface GradingCriteria {
  id: number;
  projectId: number;
  promotionId: number;
  name: string;
  weight: number;
  type: "DELIVERABLE" | "REPORT" | "PRESENTATION";
  individual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: number;
  gradingCriteriaId: number;
  groupId: number;
  studentId?: number;
  gradeValue: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinalGrade {
  id: number;
  projectId: number;
  promotionId: number;
  groupId: number;
  finalGrade: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// Minimal evaluation API functions following existing patterns
export async function getCriteria(projectId: number, promotionId: number): Promise<GradingCriteria[]> {
  return await authFetchData(`${API_URL}/projects/${projectId}/promotions/${promotionId}/criteria`);
}

export async function getGradesForCriteria(criteriaId: number): Promise<Grade[]> {
  return await authFetchData(`${API_URL}/criteria/${criteriaId}/grades`);
}

export async function createGrade(
  criteriaId: number,
  data: { groupId: number; gradeValue: number; comment?: string },
): Promise<Grade> {
  const payload = { ...data, gradingCriteriaId: criteriaId };
  return await authPostData(`${API_URL}/criteria/${criteriaId}/grades`, payload);
}

export async function updateGrade(gradeId: number, data: { gradeValue?: number; comment?: string }): Promise<Grade> {
  return await authPutData(`${API_URL}/grades/${gradeId}`, data);
}

export async function getFinalGrades(projectId: number, promotionId: number): Promise<FinalGrade[]> {
  return await authFetchData(`${API_URL}/projects/${projectId}/promotions/${promotionId}/final-grades`);
}
export interface ProjectDocument {
  id: number;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  uploadedAt: string;
  userId: number;
  projectId?: number;
}

export async function _getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
  return await authFetchData(`${API_URL}/documents/projects/${projectId}`);
}

export async function uploadDocumentToProject(projectId: number, file: File, name: string): Promise<ProjectDocument> {
  const user = await getUserFromCookie();
  if (!user) {
    throw new Error("User not found");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("name", name);
  formData.append("userId", user.id.toString());
  formData.append("projectIds", JSON.stringify([projectId]));

  return await authPostFormData(`${API_URL}/documents/upload`, formData);
}

export async function linkDocumentToProject(documentId: number, projectId: number): Promise<void> {
  return await authPostData(`${API_URL}/documents/${documentId}/projects`, { projectIds: [projectId] });
}

export async function unlinkDocumentFromProject(documentId: number, projectId: number): Promise<void> {
  return await authDeleteData(`${API_URL}/documents/${documentId}/projects/${projectId}`);
}

export async function downloadProjectDocument(documentId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_URL}/documents/${documentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.file) {
    throw new Error("Invalid response format from server");
  }

  if (!data.mimeType) {
    throw new Error("Missing mimeType in response");
  }

  const uint8Array = new Uint8Array(data.file.data || data.file);
  const blob = new Blob([uint8Array], { type: data.mimeType });

  const filename = `document-${documentId}`;

  return { blob, filename };
}
