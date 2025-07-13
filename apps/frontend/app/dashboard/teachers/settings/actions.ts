"use server";

import { getTokens, getUserFromCookie, setUserCookie } from "@/lib/cookie";
import { isNotEmpty } from "@/lib/utils";

export async function updateProfile(data: {
  firstname: string;
  lastname: string;
  email: string;
  newPassword?: string;
}) {
  const { firstname, lastname, email, newPassword } = data;
  const { accessToken } = await getTokens();
  const API_URL = process.env.API_URL ?? "http://localhost:3000";
  const user = await getUserFromCookie();
  if (!isNotEmpty(user?.id)) {
    throw new Error("User ID is missing");
  }

  const res = await fetch(`${API_URL}/users/${user.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      firstname,
      lastname,
      email,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken ?? ""}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to update profile");
  }

  await setUserCookie({
    accessToken: undefined,
    refreshToken: undefined,
    user: {
      id: user.id,
      role: user.role,
      firstname,
      lastname,
      email,
    },
  });

  if (isNotEmpty(newPassword) && isNotEmpty(user.id)) {
    const res = await fetch(`${API_URL}/users/${user.id}/password`, {
      method: "PATCH",
      body: JSON.stringify({
        newPassword,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to update password");
    }
  }
}
