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
            <h2 className="text-lg font-semibold">Actions rapides</h2>
            <div className="grid gap-3">
              <a
                href="/dashboard/students/projects"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Voir mes projets</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mes projets</p>
                  <p className="text-sm text-muted-foreground">Voir tous vos projets actifs</p>
                </div>
              </a>

              <a
                href="/dashboard/students/calendar"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Calendrier</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Calendrier</p>
                  <p className="text-sm text-muted-foreground">Voir les échéances importantes</p>
                </div>
              </a>

              <a
                href="/dashboard/students/reports"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Rapports</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mes rapports</p>
                  <p className="text-sm text-muted-foreground">Rédiger et gérer vos rapports</p>
                </div>
              </a>
            </div>
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
          <h2 className="text-lg font-semibold">Actions rapides</h2>
          <div className="grid gap-3">
            <a
              href="/dashboard/teachers/projects/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Créer un nouveau projet</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Nouveau projet</p>
                <p className="text-sm text-muted-foreground">Créer un projet pour vos étudiants</p>
              </div>
            </a>

            <a
              href="/dashboard/teachers/promotions/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Nouvelle promotion</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Nouvelle promotion</p>
                <p className="text-sm text-muted-foreground">Ajouter une nouvelle promotion</p>
              </div>
            </a>

            <a
              href="/dashboard/teachers/documents"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Mes documents</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Mes documents</p>
                <p className="text-sm text-muted-foreground">Gérer vos fichiers et ressources</p>
              </div>
            </a>
          </div>
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
