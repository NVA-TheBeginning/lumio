"use server";
import { getTokens } from "@/lib/cookie";
import { authDeleteData, authFetchData, authPostFormData } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:3000";

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

  if (data.gitUrl) {
    formData.append("gitUrl", data.gitUrl);
  }

  return await authPostFormData(`${API_URL}/deliverables/${deliverableId}/submit`, formData);
}

export async function getSubmissions(groupId: number, deliverableId?: number): Promise<SubmissionMetadataResponse[]> {
  const url = deliverableId
    ? `${API_URL}/deliverables/${groupId}/submissions?idDeliverable=${deliverableId}`
    : `${API_URL}/deliverables/${groupId}/submissions`;
  return await authFetchData(url);
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

export async function deleteSubmission(submissionId: number): Promise<void> {
  return await authDeleteData(`${API_URL}/submissions/${submissionId}`);
}
