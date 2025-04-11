"use server";
import { cookies } from "next/headers";

interface User {
  id: string;
  email: string;
  lastname?: string;
  firstname?: string;
  role?: string;
}

export async function setUserCookie(data: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user?: User;
}): Promise<void> {
  const { accessToken, refreshToken, user } = data;

  const cookieStore = await cookies();
  try {
    const oneDay = 60 * 60 * 24;
    const sevenDays = 60 * 60 * 24 * 7;

    if (user !== undefined) {
      const userCookie = JSON.stringify(user);
      cookieStore.set("user", userCookie, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: sevenDays,
      });
    }

    if (accessToken !== undefined) {
      cookieStore.set("accessToken", accessToken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: oneDay,
      });
    }

    if (refreshToken !== undefined) {
      cookieStore.set("refreshToken", refreshToken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: sevenDays,
      });
    }

    console.log("User cookie set successfully");
  } catch (error) {
    console.error("Error setting user cookie:", error);
    throw new Error("Failed to set authentication cookie");
  }
}

export async function getUserFromCookie(): Promise<User | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  try {
    if (!userCookie?.value) {
      return null;
    }

    const userData = JSON.parse(userCookie.value) as User;
    if (!userData.id || !userData.email) {
      return null;
    }

    return userData;
  } catch (error) {
    console.error("Error parsing user cookie:", error);
    return null;
  }
}

export async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  const refreshToken = cookieStore.get("refreshToken");

  return {
    accessToken: accessToken?.value || null,
    refreshToken: refreshToken?.value || null,
  };
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  try {
    cookieStore.delete("user");
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
  } catch (error) {
    console.error("Error clearing user cookie:", error);
  }
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshTokens(refreshToken: string): Promise<void> {
  if (!refreshToken) {
    throw new Error("Refresh token is missing");
  }

  const API_URL = process.env.API_URL || "http://localhost:3000";
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh tokens");
  }

  const data = (await response.json()) as RefreshResponse;
  const { accessToken, refreshToken: newRefreshToken } = data;

  await setUserCookie({ accessToken, refreshToken: newRefreshToken });
}
