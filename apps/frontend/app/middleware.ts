import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshTokens } from "@/lib/cookie";

export async function middleware(request: NextRequest) {
  const cookiesStore = await cookies();
  const user = cookiesStore.get("user")?.value;
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const accessToken = cookiesStore.get("accessToken")?.value;
  const refreshToken = cookiesStore.get("refreshToken")?.value;
  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (refreshToken && !accessToken) {
    try {
      await refreshTokens();
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
