"use server";

import { getTokens, getUserFromCookie } from "@/lib/cookie";
import { authFetchData, authPostFormData, isNotEmpty } from "@/lib/utils";

const API_URL = `${process.env.API_URL ?? "http://localhost:3000"}/documents`;

export interface Document {
  id: number;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  uploadedAt: string;
  userId: number;
}

export async function getDocuments(): Promise<Document[]> {
  const user = await getUserFromCookie();
  if (!user) {
    throw new Error("User not found");
  }
  const userId = user.id;
  return await authFetchData<Document[]>(`${API_URL}?userId=${userId}`);
}

export async function getDocumentById(id: number): Promise<Document> {
  return await authFetchData<Document>(`${API_URL}/${id}`);
}

export async function uploadDocument(file: File, name: string): Promise<Document> {
  const user = await getUserFromCookie();
  if (!user) {
    throw new Error("User not found");
  }

  const formData = new FormData();

  formData.append("file", file, file.name);
  formData.append("name", name);
  formData.append("userId", user.id.toString());

  try {
    return await authPostFormData<Document>(`${API_URL}/upload`, formData);
  } catch (error) {
    console.error("Upload document error:", error);
    throw error;
  }
}

interface DownloadDocumentResponse {
  file: Buffer;
  key: string;
  mimeType: string;
  ownerId: number;
}

export async function downloadDocument(id: number): Promise<DownloadDocumentResponse> {
  const { accessToken } = await getTokens();
  if (!isNotEmpty(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  return (await response.json()) as DownloadDocumentResponse;
}

export async function deleteDocument(id: number): Promise<void> {
  const { accessToken } = await getTokens();
  if (!isNotEmpty(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
}
