"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreatePresentationData, createPresentation, ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreatePresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectType;
  promotionId: number;
  onSuccess: () => void;
}

export function CreatePresentationDialog({
  open,
  onOpenChange,
  project,
  promotionId,
  onSuccess,
}: CreatePresentationDialogProps) {
  const [formData, setFormData] = useState({
    startDatetime: "",
    endDatetime: "",
    durationPerGroup: 15,
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePresentationData) => createPresentation(data),
    onSuccess: () => {
      toast.success("Soutenance créée avec succès");
      onSuccess();
      onOpenChange(false);
      setFormData({
        startDatetime: "",
        endDatetime: "",
        durationPerGroup: 15,
      });
    },
    onError: () => {
      toast.error("Erreur lors de la création de la soutenance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDatetime) {
      toast.error("La date de début est requise");
      return;
    }

    const data: CreatePresentationData = {
      projectId: project.id,
      promotionId,
      startDatetime: new Date(formData.startDatetime).toISOString(),
      endDatetime: formData.endDatetime ? new Date(formData.endDatetime).toISOString() : undefined,
      durationPerGroup: formData.durationPerGroup,
    };

    mutation.mutate(data);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une soutenance</DialogTitle>
          <DialogDescription>Planifiez une nouvelle soutenance pour le projet "{project.name}".</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDatetime">Date et heure de début *</Label>
            <Input
              id="startDatetime"
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              value={formData.startDatetime}
              onChange={(e) => handleInputChange("startDatetime", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDatetime">Date et heure de fin (optionnel)</Label>
            <Input
              id="endDatetime"
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              max={new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 16)}
              value={formData.endDatetime}
              onChange={(e) => handleInputChange("endDatetime", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Si non spécifiée, sera calculée automatiquement selon le nombre de groupes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationPerGroup">Durée par groupe (minutes) *</Label>
            <Input
              id="durationPerGroup"
              type="number"
              min="5"
              max="120"
              value={formData.durationPerGroup}
              onChange={(e) => handleInputChange("durationPerGroup", parseInt(e.target.value) || 15)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
