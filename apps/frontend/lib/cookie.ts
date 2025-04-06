"use server";
import { cookies } from "next/headers";

interface User {
  id: string;
  email: string;
  role?: string;
}

export async function setUserCookie(user: User): Promise<void> {
  try {
    const userCookie = JSON.stringify(user);
    const cookieStore = await cookies();

    cookieStore.set("user", userCookie, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 jours en secondes
    });

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

export async function clearUserCookie(): Promise<void> {
  try {
    (await cookies()).delete("user");
  } catch (error) {
    console.error("Error clearing user cookie:", error);
  }
}
