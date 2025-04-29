"use client";

import {
  ArrowLeft,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Group,
  MoreHorizontal,
  Plus,
  Save,
  Trash,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

const projectData = {
  id: 1,
  name: "Développement d'une application web",
  description:
    "Les étudiants devront concevoir et développer une application web complète en utilisant les technologies modernes. Le projet comprendra une phase d'analyse, de conception, de développement et de présentation.",
  creatorId: 101,
  createdAt: "2023-09-15T10:30:00Z",
  updatedAt: "2023-10-20T14:45:00Z",
  status: "visible",
  promotions: [
    {
      id: 1,
      name: "Master 2 Informatique",
      description: "Promotion 2023-2024",
      status: "visible",
      groupSettings: {
        minMembers: 3,
        maxMembers: 5,
        mode: "FREE",
        deadline: "2023-11-30T23:59:59Z",
      },
      groups: [
        {
          id: 1,
          name: "Équipe Alpha",
          members: [
            { id: 101, name: "Jean Dupont" },
            { id: 102, name: "Marie Martin" },
            { id: 103, name: "Lucas Bernard" },
          ],
        },
        {
          id: 2,
          name: "Équipe Beta",
          members: [
            { id: 104, name: "Sophie Petit" },
            { id: 105, name: "Thomas Grand" },
            { id: 106, name: "Emma Leroy" },
            { id: 107, name: "Hugo Moreau" },
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Licence 3 Informatique",
      description: "Promotion 2023-2024",
      status: "visible",
      groupSettings: {
        minMembers: 2,
        maxMembers: 4,
        mode: "MANUAL",
        deadline: "2023-12-15T23:59:59Z",
      },
      groups: [],
    },
  ],
};

interface ProjectDetailProps {
  projectId: string;
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState(projectData.name);
  const [projectDescription, setProjectDescription] = useState(projectData.description);
  const [activePromotion, setActivePromotion] = useState(projectData.promotions[0]?.id.toString());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = projectData;
  const isLoading = false;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "visible":
        return "default";
      case "draft":
        return "secondary";
      case "hidden":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "visible":
        return "Visible";
      case "draft":
        return "Brouillon";
      case "hidden":
        return "Masqué";
      default:
        return status;
    }
  };

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

  const handleSaveChanges = () => {
    // Here you would save changes to the backend
    setIsEditing(false);
  };

  const handleDeleteProject = () => {
    // Here you would delete the project
    setConfirmDelete(false);
    router.push("/dashboard/teachers/projects");
  };

  const handleChangeStatus = (newStatus: string) => {
    // Here you would update the project status
    console.log(`Changing status to ${newStatus}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement du projet...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPromotion = project.promotions.find((promo) => promo.id.toString() === activePromotion);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/dashboard/teachers/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Label htmlFor="project-name">Nom du projet</Label>
                  <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {getStatusDisplayText(project.status)}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    Créé le {formatDate(project.createdAt)} • Modifié le {formatDate(project.updatedAt)}
                  </CardDescription>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Plus d'options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {project.status === "visible" ? (
                          <DropdownMenuItem onClick={() => handleChangeStatus("hidden")}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Masquer le projet
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleChangeStatus("visible")}>
                            <Eye className="mr-2 h-4 w-4" />
                            Rendre visible
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(true)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Supprimer le projet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p>{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Promotions associées</CardTitle>
              <CardDescription>Gérez les promotions et les groupes d'étudiants pour ce projet</CardDescription>
            </CardHeader>
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
                  <Button variant="ghost" size="sm" className="ml-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </TabsList>

                {project.promotions.map((promotion) => (
                  <TabsContent key={promotion.id} value={promotion.id.toString()} className="space-y-6">
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">{promotion.name}</h3>
                          <p className="text-sm text-muted-foreground">{promotion.description}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(promotion.status)}>
                          {getStatusDisplayText(promotion.status)}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Paramètres des groupes
                        </h4>
                        {promotion.groupSettings ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
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
                            <div className="flex justify-end items-end">
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3 mr-2" />
                                Modifier
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground mb-2">Aucun paramètre de groupe défini</p>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Configurer les groupes
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Groupes d'étudiants
                        </h4>
                        {promotion.groups && promotion.groups.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {promotion.groups.map((group) => (
                              <Card key={group.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 py-3">
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">{group.name}</CardTitle>
                                    <Badge variant="outline">{group.members.length} étudiants</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="py-3">
                                  <ul className="space-y-1">
                                    {group.members.map((member) => (
                                      <li key={member.id} className="text-sm">
                                        {member.name}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                                <CardFooter className="bg-muted/30 py-2 flex justify-end">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-3 w-3 mr-2" />
                                    Modifier
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
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Gérer les livrables
              </Button>
              <Button className="w-full justify-start">
                <Group className="mr-2 h-4 w-4" />
                Gérer les soutenances
              </Button>
              <Button className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gérer les évaluations
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-md text-center">
                  <p className="text-2xl font-bold">
                    {project.promotions.reduce((total, promo) => total + promo.groups.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Groupes</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-md text-center">
                  <p className="text-2xl font-bold">
                    {project.promotions.reduce(
                      (total, promo) =>
                        total + promo.groups.reduce((groupTotal, group) => groupTotal + group.members.length, 0),
                      0,
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Étudiants</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-md text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Livrables</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-md text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Évaluations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le projet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
