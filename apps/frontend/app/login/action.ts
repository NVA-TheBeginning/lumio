"use server";
import { LoginFormValues } from "@/components/login-form";
import { setUserCookie } from "@/lib/cookie";
import { Role } from "@/lib/types";
import { LoginResponse } from "@/types/auth";

export async function loginApiClient(credentials: LoginFormValues): Promise<Role | undefined> {
  const API_URL = process.env.API_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Identifiants incorrects");
    }

    const data = (await response.json()) as LoginResponse;

    const { id, email, lastname, firstname, role, AuthTokens } = data;

    await setUserCookie({
      accessToken: AuthTokens.accessToken,
      refreshToken: AuthTokens.refreshToken,
      user: { id, email, lastname, firstname, role },
    });

    return role;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}
