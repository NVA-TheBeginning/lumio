"use client";

import type React from "react";
import { useState } from "react";
import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectType;
  onSuccess: () => void;
}

export function CreateDeliverableDialog({ open, onOpenChange, project, onSuccess }: CreateDeliverableDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log({
        title,
        description,
        deadline,
        promotionId,
        projectId: project.id,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTitle("");
      setDescription("");
      setDeadline("");
      setPromotionId("");

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la création du livrable:", error);
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
              <Label htmlFor="title">Titre du livrable</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
