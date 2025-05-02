"use client";

import { ArrowLeft, Copy, Edit, Eye, EyeOff, MoreHorizontal, Trash } from "lucide-react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState } from "react";
import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

interface ProjectHeaderProps {
  project: ProjectType;
  router: AppRouterInstance;
}

export function ProjectHeader({ project, router }: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);

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

  const handleSaveChanges = () => {
    setIsEditing(false);
  };

  const handleDeleteProject = () => {
    setConfirmDelete(false);
    router.push("/dashboard/teachers/projects");
  };

  const handleChangeStatus = (newStatus: string) => {
    console.log(`Changing status to ${newStatus}`);
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/teachers/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/teachers">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/teachers/projects">Projets</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{project.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(project.status)}>{getStatusDisplayText(project.status)}</Badge>
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
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer le projet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Supprimer le projet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>Modifiez les informations du projet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Nom du projet</Label>
              <Input id="edit-project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea
                id="edit-project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveChanges}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
