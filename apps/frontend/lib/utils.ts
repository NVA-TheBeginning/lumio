import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getTokens } from "./cookie";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("fr-FR", options);
}

export async function authFetchData<T>(url: string): Promise<T> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export async function authPostData<T>(url: string, data: unknown): Promise<T> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
}
