"use client";

import { Clock } from "lucide-react";
import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ProjectStatistics } from "../statistic";

interface ProjectOverviewProps {
  project: ProjectType;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const getDeliverableStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>;
      case "active":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "upcoming":
        return <Badge variant="outline">À venir</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">À propos du projet</CardTitle>
            <CardDescription>
              Créé le {formatDate(project.createdAt)} • Modifié le {formatDate(project.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{project.description}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold">Promotions associées</h3>
              <ul className="mt-2 space-y-2">
                {project.promotions.map((promotion) => (
                  <li
                    key={promotion.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{promotion.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {promotion.description.length > 50
                          ? `${promotion.description.slice(0, 50)}...`
                          : promotion.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Livrables à venir</CardTitle>
            <CardDescription>Prochaines échéances pour ce projet</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {project.deliverables
                .filter((d) => d.status === "active" || d.status === "upcoming")
                .slice(0, 4)
                .map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{deliverable.title}</h3>
                        {getDeliverableStatusBadge(deliverable.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{deliverable.description}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Échéance: {formatDate(deliverable.deadline)} (
                          {new Date(deliverable.deadline) > new Date()
                            ? `dans ${Math.ceil(
                                (new Date(deliverable.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                              )} jours`
                            : "dépassée"}
                          )
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/dashboard/teachers/projects/${project.id}/deliverables/${deliverable.id}`;
                      }}
                    >
                      Détails
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ProjectStatistics project={project} />
      </div>
    </div>
  );
}
