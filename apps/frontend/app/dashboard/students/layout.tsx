import React from "react";
import { getUserFromCookie } from "@/lib/cookie";
import DashboardClientLayout from "./client-layout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie();

  return (
    <DashboardClientLayout
      user={{
        firstname: user?.firstname || null,
        email: user?.email || "",
        role: user?.role || "STUDENT",
      }}
    >
      {children}
    </DashboardClientLayout>
  );
}
