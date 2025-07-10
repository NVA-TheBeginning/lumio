import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshTokens } from "@/lib/cookie";
import { isTruthy } from "@/lib/utils";

export async function middleware(request: NextRequest) {
  const cookiesStore = await cookies();
  const user = cookiesStore.get("user")?.value;

  if (!isTruthy(user)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const accessToken = cookiesStore.get("accessToken")?.value;
  const refreshToken = cookiesStore.get("refreshToken")?.value;

  if (!(isTruthy(accessToken) || isTruthy(refreshToken))) {
    cookiesStore.delete("user");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isTruthy(refreshToken) && !isTruthy(accessToken)) {
    try {
      await refreshTokens(refreshToken);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      cookiesStore.delete("user");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
  runtime: "nodejs",
};
