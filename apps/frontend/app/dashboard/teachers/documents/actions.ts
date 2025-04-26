"use server";

import { getTokens, getUserFromCookie } from "@/lib/cookie";
import { authFetchData, authPostFormData } from "@/lib/utils";

const API_URL = `${process.env.API_URL}/documents`;

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
  const response = (await authFetchData(`${API_URL}?userId=${userId}`)) as Document[];
  return response;
}

export async function getDocumentById(id: number): Promise<Document> {
  const response = (await authFetchData(`${API_URL}/${id}`)) as Document;
  return response;
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
    const response = await authPostFormData(`${API_URL}/upload`, formData);

    return response as Document;
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
  if (!accessToken) {
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

  return (await response.json()) as Promise<DownloadDocumentResponse>;
}

export async function deleteDocument(id: number): Promise<void> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
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
