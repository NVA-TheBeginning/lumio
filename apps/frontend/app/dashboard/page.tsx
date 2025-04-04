import Link from "next/link";
import { getUserFromCookie } from "@/lib/cookie";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUserFromCookie();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="absolute top-8 left-8 text-primary font-bold text-xl">
        Lumio - Dashboard
      </Link>
      {user ? <p>Welcome, {user.email}</p> : <p>Please log in.</p>}
    </div>
  );
}
