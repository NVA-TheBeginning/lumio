"use server";
import { getTokens } from "@/lib/cookie";
import { authDeleteData, authFetchData, authPostFormData } from "@/lib/utils";
import type { FinalGrade } from "@/types/evaluation";

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
  gradedAt: string;
}

export interface CriteriaWithGrade extends GradingCriteria {
  studentGrade?: Grade;
}

export interface StudentEvaluations {
  finalGrades: FinalGrade[];
  criteriaWithGrades: CriteriaWithGrade[];
}

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export interface SubmissionData {
  groupId: number;
  file?: File;
  gitUrl?: string;
}

export interface SubmissionResponse {
  id: number;
  deliverableId: number;
  groupId: number;
  status: string;
  penalty: number;
  fileUrl?: string;
  gitUrl?: string;
  submissionDate: string;
}

export interface SubmissionMetadataResponse {
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
}

export async function submitDeliverable(deliverableId: number, data: SubmissionData): Promise<SubmissionResponse> {
  const formData = new FormData();

  formData.append("groupId", data.groupId.toString());

  if (data.file) {
    formData.append("file", data.file);
  }

  if (data.gitUrl != null && data.gitUrl !== "") {
    formData.append("gitUrl", data.gitUrl);
  }

  return await authPostFormData(`${API_URL}/deliverables/${deliverableId}/submit`, formData);
}

export async function getSubmissions(groupId: number, deliverableId?: number): Promise<SubmissionMetadataResponse[]> {
  const url =
    deliverableId != null
      ? `${API_URL}/deliverables/${groupId}/submissions?idDeliverable=${deliverableId}`
      : `${API_URL}/deliverables/${groupId}/submissions`;
  return await authFetchData(url);
}

export async function getSubmissionDownloadData(submissionId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  const { accessToken } = await getTokens();
  if (accessToken == null || accessToken === "") {
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

  if (contentDisposition != null && contentDisposition !== "") {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch?.[1] != null && filenameMatch[1] !== "") {
      filename = filenameMatch[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

export async function deleteSubmission(submissionId: number): Promise<void> {
  await authDeleteData(`${API_URL}/submissions/${submissionId}`);
}

export async function getFinalGrades(projectId: number, promotionId: number): Promise<FinalGrade[]> {
  return await authFetchData(`${API_URL}/projects/${projectId}/promotions/${promotionId}/final-grades`);
}

export async function getStudentEvaluations(projectId: number): Promise<StudentEvaluations> {
  return await authFetchData(`${API_URL}/students/me/projects/${projectId}/evaluations`);
}

export async function downloadProjectDocument(documentId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  const { accessToken } = await getTokens();
  if (accessToken == null || accessToken === "") {
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

  if (data.file == null) {
    throw new Error("Invalid response format from server");
  }

  if (data.mimeType == null) {
    throw new Error("Missing mimeType in response");
  }

  const uint8Array = new Uint8Array(data.file.data ?? data.file);
  const blob = new Blob([uint8Array], { type: data.mimeType });

  const filename = `document-${documentId}`;

  return { blob, filename };
}
