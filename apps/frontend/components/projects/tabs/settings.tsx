"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProjectSettings() {
  const [, setConfirmDelete] = useState(false);

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
                <h3 className="font-medium">Détection de plagiat</h3>
                <p className="text-sm text-muted-foreground">
                  Activer la détection automatique de plagiat pour les livrables
                </p>
              </div>
              <Button variant="outline">Configurer</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Configurer les notifications pour les événements du projet
                </p>
              </div>
              <Button variant="outline">Configurer</Button>
            </div>
            <Separator />
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
    </div>
  );
}
