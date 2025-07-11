"use client";

import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProject } from "@/app/dashboard/teachers/projects/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectSettings({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await deleteProject(projectId);
    },
    onSuccess: () => {
      toast.success("Projet supprimé avec succès");
      router.push("/dashboard/teachers/projects");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du projet");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres du projet</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Paramètres avancés</CardTitle>
          <CardDescription>Options supplémentaires pour ce projet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Exportation des données</h3>
                <p className="text-sm text-muted-foreground">Exporter les données du projet</p>
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-destructive/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-destructive">Supprimer le projet</h3>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. Toutes les données associées seront supprimées.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement votre projet ainsi que toutes les
              données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProjectMutation.mutate(projectId)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
