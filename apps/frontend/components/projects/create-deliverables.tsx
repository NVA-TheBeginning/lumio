"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createDeliverable, ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectType;
  onSuccess: () => void;
}

export function CreateDeliverableDialog({ open, onOpenChange, project, onSuccess }: CreateDeliverableDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lateSubmissionPenalty, setLateSubmissionPenalty] = useState(0);
  const [deliverableType, setDeliverableType] = useState<string[]>(["FILE"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && project.promotions.length > 0 && !promotionId && project.promotions[0]) {
      setPromotionId(project.promotions[0].id.toString());
    }
  }, [open, project.promotions, promotionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedPromotionId =
        promotionId ||
        (project.promotions.length > 0 && project.promotions[0] ? project.promotions[0].id.toString() : "");

      if (!selectedPromotionId) {
        toast.error("Veuillez sélectionner une promotion");
        setIsSubmitting(false);
        return;
      }

      await createDeliverable({
        projectId: project.id,
        promotionId: Number(selectedPromotionId),
        name,
        description: description || undefined,
        deadline,
        allowLateSubmission,
        lateSubmissionPenalty,
        type: deliverableType,
      });

      setName("");
      setDescription("");
      setDeadline("");
      setPromotionId("");
      setAllowLateSubmission(false);
      setLateSubmissionPenalty(0);
      setDeliverableType(["FILE"]);

      onOpenChange(false);
      onSuccess();
      toast.success("Livrable créé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création du livrable:", error);
      toast.error("Erreur lors de la création du livrable");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un nouveau livrable</DialogTitle>
            <DialogDescription>Définissez un nouveau livrable pour une promotion spécifique.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="promotion">Promotion</Label>
              <Select value={promotionId} onValueChange={setPromotionId} required>
                <SelectTrigger id="promotion">
                  <SelectValue placeholder="Sélectionner une promotion" />
                </SelectTrigger>
                <SelectContent>
                  {project.promotions.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                      {promotion.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du livrable</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">Date limite</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type de livrable</Label>
              <Select value={deliverableType[0]} onValueChange={(value) => setDeliverableType([value])}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILE">Fichier</SelectItem>
                  <SelectItem value="GIT">Dépôt Git</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowLateSubmission"
                checked={allowLateSubmission}
                onCheckedChange={(checked) => setAllowLateSubmission(checked as boolean)}
              />
              <Label htmlFor="allowLateSubmission">Autoriser les soumissions en retard</Label>
            </div>
            {allowLateSubmission && (
              <div className="grid gap-2">
                <Label htmlFor="penalty">Pénalité par jour de retard (%)</Label>
                <Input
                  id="penalty"
                  type="number"
                  min="0"
                  max="100"
                  value={lateSubmissionPenalty}
                  onChange={(e) => setLateSubmissionPenalty(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création en cours..." : "Créer le livrable"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
