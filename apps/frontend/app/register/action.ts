"use server";
import type { RegisterFormValues } from "@/components/register-form";

export async function registerApi(userData: RegisterFormValues): Promise<void> {
  const API_URL = "http://localhost:3000";
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Échec de l'inscription");
  }
}
