"use server";
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

export async function getSubmissions(deliverableId: number) {
  return await authFetchData(`${API_URL}/deliverables/${deliverableId}/submissions`);
}

export async function getSubmission(deliverableId: number, submissionId: number) {
  return await authFetchData(`${API_URL}/deliverables/${deliverableId}/submissions/${submissionId}`);
}

export async function deleteSubmission(deliverableId: number, submissionId: number): Promise<void> {
  return await authDeleteData(`${API_URL}/deliverables/${deliverableId}/submissions/${submissionId}`);
}
