"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ProjectType, updateProjectStatus } from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { ProjectStatus } from "../header";
import { ProjectStatistics } from "../statistic";

interface ProjectOverviewProps {
  project: ProjectType;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      idProject,
      idPromotion,
      status,
    }: {
      idProject: number;
      idPromotion: number;
      status: ProjectStatus;
    }) => {
      const a = await updateProjectStatus(idProject, idPromotion, status as ProjectStatus);
      console.log("Mutation result:", a);
      return a;
    },
    onSuccess: () => {
      toast.success("Statut du projet mis à jour");
      queryClient.invalidateQueries({
        queryKey: ["projects", project.id],
      });
    },
  });

  const getStatusDisplayText = (status: ProjectStatus | string) => {
    switch (status) {
      case ProjectStatus.VISIBLE:
        return "Visible";
      case ProjectStatus.DRAFT:
        return "Brouillon";
      case ProjectStatus.HIDDEN:
        return "Masqué";
      default:
        return status;
    }
  };

  const handleChangeStatus = (promotionId: number, newStatus: ProjectStatus) => {
    updateStatusMutation.mutate({
      idProject: project.id,
      idPromotion: promotionId,
      status: newStatus,
    });
  };

  const upcomingDeliverables =
    project.deliverables?.filter((deliverable) => {
      const deadlineDate = new Date(deliverable.deadline);
      return deadlineDate >= new Date();
    }) || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
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
                {project.promotions?.map((promotion) => (
                  <li
                    key={promotion.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{promotion.name}</h4>
                        <Badge variant="secondary">{getStatusDisplayText(promotion.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {promotion.description && promotion.description.length > 50
                          ? `${promotion.description.slice(0, 50)}...`
                          : promotion.description || "Aucune description"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Changer le statut pour {promotion.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {promotion.status === ProjectStatus.VISIBLE ? (
                          <DropdownMenuItem onClick={() => handleChangeStatus(promotion.id, ProjectStatus.HIDDEN)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Masquer pour cette promotion
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleChangeStatus(promotion.id, ProjectStatus.VISIBLE)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Rendre visible pour cette promotion
                          </DropdownMenuItem>
                        )}
                        {promotion.status !== ProjectStatus.DRAFT && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(promotion.id, ProjectStatus.DRAFT)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Mettre en brouillon pour cette promotion
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )) || []}
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
              {upcomingDeliverables.length > 0 ? (
                upcomingDeliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {deliverable.type?.map((type: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
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
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Aucun livrable à venir</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tous les livrables sont soit terminés, soit leur échéance est dépassée.
                  </p>
                </div>
              )}
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
