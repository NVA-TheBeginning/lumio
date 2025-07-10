"use server";

import { Role } from "@/app/login/page";
import { setUserCookie } from "@/lib/cookie";

interface LoginResponse {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
  AuthTokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function googleOAuthLogin(token: string): Promise<Role | undefined> {
  const API_URL = process.env.API_URL ?? "http://localhost:3000";

  const response = await fetch(`${API_URL}/auth/oauth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = (await response.json()) as LoginResponse;

  const { id, email, lastname, firstname, role, AuthTokens } = data;

  await setUserCookie({
    accessToken: AuthTokens.accessToken,
    refreshToken: AuthTokens.refreshToken,
    user: { id, email, lastname, firstname, role },
  });

  return role;
}
