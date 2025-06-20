"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PresentationType,
  UpdatePresentationData,
  updatePresentation,
} from "@/app/dashboard/teachers/projects/actions";
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

interface EditPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentation: PresentationType | null;
  onSuccess: () => void;
}

export function EditPresentationDialog({ open, onOpenChange, presentation, onSuccess }: EditPresentationDialogProps) {
  const [formData, setFormData] = useState({
    startDatetime: "",
    endDatetime: "",
    durationPerGroup: 15,
  });

  useEffect(() => {
    if (presentation && open) {
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        startDatetime: formatDateForInput(presentation.startDatetime),
        endDatetime: presentation.endDatetime ? formatDateForInput(presentation.endDatetime) : "",
        durationPerGroup: presentation.durationPerGroup,
      });
    }
  }, [presentation, open]);

  const mutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdatePresentationData }) => updatePresentation(data.id, data.updates),
    onSuccess: () => {
      toast.success("Soutenance modifiée avec succès");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de la modification de la soutenance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!presentation) return;

    if (!formData.startDatetime) {
      toast.error("La date de début est requise");
      return;
    }

    const data: UpdatePresentationData = {
      startDatetime: formData.startDatetime,
      endDatetime: formData.endDatetime || undefined,
      durationPerGroup: formData.durationPerGroup,
    };

    mutation.mutate({
      id: presentation.id,
      updates: data,
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!presentation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la soutenance</DialogTitle>
          <DialogDescription>Modifiez les paramètres de la soutenance.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDatetime">Date et heure de début *</Label>
            <Input
              id="startDatetime"
              type="datetime-local"
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
              {mutation.isPending ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
