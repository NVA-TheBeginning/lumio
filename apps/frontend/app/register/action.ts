"use server";
import type { RegisterFormValues } from "@/components/register-form";

export async function registerApi(userData: RegisterFormValues): Promise<void> {
  const data = { email: userData.email, password: userData.password };
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Échec de l'inscription");
  }
}
