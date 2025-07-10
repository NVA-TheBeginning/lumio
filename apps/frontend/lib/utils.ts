import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function isTruthy(value: string | undefined | null): value is string {
  if (value === undefined || value === null) {
    return false;
  }
  return Boolean(value.trim());
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("fr-FR", options);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("fr-FR", options);
}

export async function authFetchData<T>(url: string): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
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

  return await response.json();
}

export async function authPostData<T>(url: string, data: unknown): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
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

  return await response.json();
}

export async function authPostFormData<T>(url: string, formData: FormData): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
}

export async function authPutData<T>(url: string, data: unknown): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
}

export async function authPatchData<T>(url: string, data: unknown): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
}

export async function authDeleteData<T = void>(url: string): Promise<T> {
  const { getTokens } = await import("@/lib/cookie");
  const { accessToken } = await getTokens();
  if (!isTruthy(accessToken)) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  let unit: string;

  if (i >= sizes.length) {
    const lastUnit = sizes[sizes.length - 1];
    unit = lastUnit ?? "Unknown Unit";
  } else {
    const currentUnit = sizes[i];
    unit = currentUnit ?? "Unknown Unit";
  }

  return `${Number.parseFloat((bytes / k ** (i >= sizes.length ? sizes.length - 1 : i)).toFixed(dm))} ${unit}`;
}

export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}
