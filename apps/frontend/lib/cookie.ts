import { cookies } from "next/headers";

interface User {
  id: string;
  email: string;
}

export async function getUserFromCookie(): Promise<User | null> {
  try {
    const userCookie = (await cookies()).get("user");

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
