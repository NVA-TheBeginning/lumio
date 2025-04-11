import { getUserFromCookie } from "@/lib/cookie";

export default async function DashboardPage() {
  const user = await getUserFromCookie();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur Lumio, {user?.firstname || user?.email || "Visiteur"}</p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Projets actifs</h2>
          <p className="text-3xl font-bold">{Math.floor(Math.random() * 100)}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Livrables en attente</h2>
          <p className="text-3xl font-bold">{Math.floor(Math.random() * 50)}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Promotions</h2>
          <p className="text-3xl font-bold">{Math.floor(Math.random() * 10)}</p>
        </div>
      </div>

      <div className="bg-card min-h-[40vh] flex-1 rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Activité récente</h2>
        <p className="text-muted-foreground">Aucune activité récente.</p>
      </div>
    </div>
  );
}
