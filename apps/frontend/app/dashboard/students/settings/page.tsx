"use server";
import { getUserFromCookie } from "@/lib/cookie";
import ParametersForm from "./client";

export default async function ServerSettingsPage() {
  const user = await getUserFromCookie();

  if (!user?.email) {
    return <div>Vous devez être connecté pour accéder à cette page.</div>;
  }

  return <ParametersForm firstname={user?.firstname} lastname={user?.lastname} email={user?.email} />;
}
