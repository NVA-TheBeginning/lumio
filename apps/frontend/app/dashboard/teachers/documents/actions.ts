"use server";

import { getTokens, getUserFromCookie } from "@/lib/cookie";
import { authFetchData, authPostData } from "@/lib/utils";

const API_URL = `${process.env.API_URL}/documents`;

export interface Document {
  id: number;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
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

  console.log("Upload request:", {
    fileName: file.name,
    fileSize: file.size,
    documentName: name,
    userId: user.id,
  });

  try {
    const response = await authPostData(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    return response as Document;
  } catch (error) {
    console.error("Upload document error:", error);
    throw error;
  }
}

export async function downloadDocument(id: number): Promise<Blob> {
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

  return await response.blob();
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
