"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatisticsCard } from "@/components/dashboard/statistics-card";
import { useDashboardStatistics, useRecentActivity } from "@/lib/hooks/use-dashboard";
import { UserRole } from "@/lib/types/dashboard";

interface User {
  id: string;
  email: string;
  lastname?: string;
  firstname?: string;
  role?: string;
}

interface DashboardContentProps {
  user: User | null;
  userRole: UserRole;
  displayName: string;
}

export function DashboardContent({ user, userRole, displayName }: DashboardContentProps) {
  const {
    data: statistics,
    isLoading: statisticsLoading,
    error: statisticsError,
  } = useDashboardStatistics(user?.id ? Number(user.id) : 0, userRole);

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useRecentActivity(user?.id ? Number(user.id) : 0, userRole);

  if (userRole === "STUDENT") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue sur Lumio, {displayName}</p>
        </div>

        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <StatisticsCard
            title="Projets en cours"
            value={statistics?.participantProjects ?? 0}
            isLoading={statisticsLoading}
            description="Projets auxquels vous participez"
          />
          <StatisticsCard
            title="Mes groupes"
            value={statistics?.groupMemberships ?? 0}
            isLoading={statisticsLoading}
            description="Groupes dont vous faites partie"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Informations générales</h2>
            <p className="text-muted-foreground text-sm">
              Vous participez à {statistics?.participantProjects ?? 0} projet(s) actif(s) répartis dans{" "}
              {statistics?.groupMemberships ?? 0} groupe(s) de travail.
            </p>
          </div>

          <ActivityFeed activities={activities ?? []} isLoading={activitiesLoading} />
        </div>

        {(statisticsError || activitiesError) && (
          <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">
              Une erreur s'est produite lors du chargement des données du tableau de bord.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Teacher/Admin dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur Lumio, {displayName}</p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <StatisticsCard
          title="Projets actifs"
          value={statistics?.activeProjects ?? 0}
          isLoading={statisticsLoading}
          description="Projets visibles aux étudiants"
        />
        <StatisticsCard
          title="Total des projets"
          value={statistics?.totalProjects ?? 0}
          isLoading={statisticsLoading}
          description="Tous vos projets créés"
        />
        <StatisticsCard
          title="Projets brouillons"
          value={statistics?.draftProjects ?? 0}
          isLoading={statisticsLoading}
          description="En préparation"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Résumé de vos projets</h2>
          <div className="grid gap-4">
            <StatisticsCard
              title="Projets cachés"
              value={statistics?.hiddenProjects ?? 0}
              isLoading={statisticsLoading}
              description="Temporairement masqués aux étudiants"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Vous avez créé {statistics?.totalProjects ?? 0} projet(s) au total, dont {statistics?.activeProjects ?? 0}{" "}
            actuellement visible(s) aux étudiants.
          </p>
        </div>

        <ActivityFeed activities={activities ?? []} isLoading={activitiesLoading} />
      </div>

      {(statisticsError || activitiesError) && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">
            Une erreur s'est produite lors du chargement des données du tableau de bord.
          </p>
        </div>
      )}
    </div>
  );
}
