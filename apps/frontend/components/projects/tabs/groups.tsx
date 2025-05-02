"use client";

import { Edit, Filter, Plus, Settings, Trash, Users } from "lucide-react";
import { useState } from "react";
import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

interface ProjectGroupsProps {
  project: ProjectType;
}

export function ProjectGroups({ project }: ProjectGroupsProps) {
  const [activePromotion, setActivePromotion] = useState(project.promotions[0]?.id.toString());

  const unassignedStudents = [
    { id: 201, name: "Alexandre Dubois" },
    { id: 202, name: "Camille Lefevre" },
    { id: 203, name: "Maxime Girard" },
  ];

  const getGroupModeText = (mode: string) => {
    switch (mode) {
      case "RANDOM":
        return "Aléatoire";
      case "MANUAL":
        return "Manuel (par l'enseignant)";
      case "FREE":
        return "Libre (par les étudiants)";
      default:
        return mode;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des groupes</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Créer un groupe
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Tabs
            defaultValue={activePromotion}
            value={activePromotion}
            onValueChange={setActivePromotion}
            className="w-full"
          >
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              {project.promotions.map((promotion) => (
                <TabsTrigger key={promotion.id} value={promotion.id.toString()} className="min-w-max">
                  {promotion.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {project.promotions.map((promotion) => (
              <TabsContent key={promotion.id} value={promotion.id.toString()} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{promotion.name}</h3>
                    <p className="text-sm text-muted-foreground">{promotion.description}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres des groupes
                    </h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-2" />
                      Modifier
                    </Button>
                  </div>
                  {promotion.groupSettings ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Mode de constitution</p>
                        <p className="text-sm">{getGroupModeText(promotion.groupSettings.mode)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Taille des groupes</p>
                        <p className="text-sm">
                          {promotion.groupSettings.minMembers} à {promotion.groupSettings.maxMembers} étudiants
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date limite</p>
                        <p className="text-sm">{formatDate(promotion.groupSettings.deadline)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">Aucun paramètre de groupe défini</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Groupes d'étudiants ({promotion.groups.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrer
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un groupe
                    </Button>
                  </div>
                </div>

                {promotion.groups && promotion.groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotion.groups.map((group) => (
                      <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <Badge variant="outline">{group.members.length} étudiants</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <ul className="space-y-1">
                            {group.members.map((member) => (
                              <li key={member.id} className="text-sm flex justify-between items-center">
                                <span>{member.name}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="bg-muted/30 py-2 flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3 mr-2" />
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash className="h-3 w-3 mr-2" />
                            Supprimer
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Aucun groupe n'a encore été créé</p>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer des groupes
                    </Button>
                  </div>
                )}

                {promotion.groups.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Étudiants non assignés ({unassignedStudents.length})
                      </h4>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des étudiants
                      </Button>
                    </div>
                    {unassignedStudents.length > 0 ? (
                      <ul className="space-y-2">
                        {unassignedStudents.map((student) => (
                          <li
                            key={student.id}
                            className="flex justify-between items-center p-2 bg-background rounded-md"
                          >
                            <span className="text-sm">{student.name}</span>
                            <Button variant="outline" size="sm">
                              Assigner à un groupe
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Tous les étudiants sont assignés à un groupe
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
