import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getUserFromCookie } from "@/lib/cookie";
import { isTruthy } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getUserFromCookie();
  const displayName = isTruthy(user?.firstname) ? user.firstname : isTruthy(user?.email) ? user.email : "Visiteur";

  return <DashboardContent user={user} userRole="STUDENT" displayName={displayName} />;
}
