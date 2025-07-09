"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Edit, MoreHorizontal, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deletePresentation,
  getPresentations,
  PresentationType,
  ProjectType,
} from "@/app/dashboard/teachers/projects/actions";
import { CreatePresentationDialog } from "@/components/projects/presentations/create-presentation-dialog";
import { EditPresentationDialog } from "@/components/projects/presentations/edit-presentation-dialog";
import { PresentationOrdersManager } from "@/components/projects/presentations/presentation-orders-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

interface ProjectPresentationsProps {
  project: ProjectType;
}

export function ProjectPresentations({ project }: ProjectPresentationsProps) {
  const queryClient = useQueryClient();
  const [activePromotion, setActivePromotion] = useState<string>(project.promotions[0]?.id.toString() || "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationType | null>(null);

  const { data: presentations, isLoading } = useQuery({
    queryKey: ["presentations", project.id, activePromotion],
    queryFn: () => getPresentations(project.id, Number(activePromotion)),
    enabled: !!activePromotion,
  });

  const deleteMutation = useMutation({
    mutationFn: (presentation: PresentationType) => deletePresentation(presentation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentations", project.id, activePromotion] });
      toast.success("Soutenance supprimée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la soutenance");
    },
  });

  const handleCreatePresentation = () => {
    setShowCreateDialog(true);
  };

  const handleEditPresentation = (presentation: PresentationType) => {
    setSelectedPresentation(presentation);
    setShowEditDialog(true);
  };

  const handleDeletePresentation = (presentation: PresentationType) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette soutenance ?")) {
      deleteMutation.mutate(presentation);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
    }
    return `${mins}min`;
  };

  const getActivePromotion = () => {
    return project.promotions.find((p) => p.id === Number(activePromotion)) ?? project.promotions[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des soutenances</h1>
          <p className="text-muted-foreground">Planifiez et organisez l'ordre de passage des groupes</p>
        </div>
      </div>

      <Card>
        <CardContent>
          {project.promotions.length > 1 ? (
            <Tabs value={activePromotion} onValueChange={setActivePromotion}>
              <TabsList className="mb-6">
                {project.promotions.map((promotion) => (
                  <TabsTrigger key={promotion.id} value={promotion.id.toString()}>
                    {promotion.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {project.promotions.map((promotion) => (
                <TabsContent key={promotion.id} value={promotion.id.toString()}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Soutenances pour {promotion.name}</h3>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                      </div>
                    ) : presentations?.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Aucune soutenance planifiée</h3>
                        <p className="mt-2 text-muted-foreground">
                          Créez votre première soutenance pour cette promotion.
                        </p>
                        <Button className="mt-4" onClick={handleCreatePresentation}>
                          <Plus className="mr-2 h-4 w-4" />
                          Créer une soutenance
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {presentations?.map((presentation) => (
                          <div key={presentation.id} className="space-y-4">
                            <Card className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">
                                    Soutenance du {formatDate(presentation.startDatetime)}
                                  </CardTitle>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditPresentation(presentation)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeletePresentation(presentation)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(presentation.startDatetime)}</span>
                                  </div>
                                  {presentation.endDatetime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>Fin: {formatDate(presentation.endDatetime)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDuration(presentation.durationPerGroup)} par groupe</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="outline">{getActivePromotion()?.groups.length || 0} groupes</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            {(() => {
                              const activePromotion = getActivePromotion();
                              if (activePromotion) {
                                return (
                                  <PresentationOrdersManager presentation={presentation} promotion={activePromotion} />
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : presentations?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Aucune soutenance planifiée</h3>
                  <p className="mt-2 text-muted-foreground">Créez votre première soutenance pour cette promotion.</p>
                  <Button className="mt-4" onClick={handleCreatePresentation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une soutenance
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {presentations?.map((presentation) => (
                    <div key={presentation.id} className="space-y-4">
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Soutenance du {formatDate(presentation.startDatetime)}
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPresentation(presentation)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeletePresentation(presentation)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(presentation.startDatetime)}</span>
                            </div>
                            {presentation.endDatetime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Fin: {formatDate(presentation.endDatetime)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDuration(presentation.durationPerGroup)} par groupe</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline">{getActivePromotion()?.groups.length || 0} groupes</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {(() => {
                        const activePromotion = getActivePromotion();
                        if (activePromotion) {
                          return <PresentationOrdersManager presentation={presentation} promotion={activePromotion} />;
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePresentationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        project={project}
        promotionId={Number(activePromotion)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["presentations", project.id, activePromotion] });
        }}
      />

      <EditPresentationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        presentation={selectedPresentation}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["presentations", project.id, activePromotion] });
        }}
      />
    </div>
  );
}
