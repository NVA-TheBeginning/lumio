"use server";
import { LoginFormValues } from "@/components/login-form";
import { setUserCookie } from "@/lib/cookie";

export async function loginApiClient(credentials: LoginFormValues): Promise<void> {
  const API_URL = "http://localhost:3000";
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Identifiants incorrects");
  }
  const data = await response.json();
  await setUserCookie({
    id: data.id,
    email: data.email,
  });
}
