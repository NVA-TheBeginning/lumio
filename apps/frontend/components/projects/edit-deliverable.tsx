"use client";

import { Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DeliverableType,
  deleteDeliverable,
  ProjectType,
  updateDeliverable,
} from "@/app/dashboard/teachers/projects/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface EditDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: DeliverableType | null;
  project: ProjectType;
  onSuccess: () => void;
}

export function EditDeliverableDialog({
  open,
  onOpenChange,
  deliverable,
  project,
  onSuccess,
}: EditDeliverableDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lateSubmissionPenalty, setLateSubmissionPenalty] = useState(0);
  const [deliverableType, setDeliverableType] = useState<string[]>(["FILE"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (deliverable) {
      setName(deliverable.name);
      setDescription(deliverable.description || "");
      const date = new Date(deliverable.deadline);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      setDeadline(localDate.toISOString().slice(0, 16));
      setPromotionId(deliverable.promotionId.toString());
      setAllowLateSubmission(deliverable.allowLateSubmission);
      setLateSubmissionPenalty(deliverable.lateSubmissionPenalty);
      setDeliverableType(deliverable.type);
    }
  }, [deliverable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverable) return;

    setIsSubmitting(true);

    try {
      await updateDeliverable({
        id: deliverable.id,
        projectId: project.id,
        promotionId: Number(promotionId),
        name,
        description: description || undefined,
        deadline,
        allowLateSubmission,
        lateSubmissionPenalty,
        type: deliverableType,
      });

      onOpenChange(false);
      onSuccess();
      toast.success("Livrable modifié avec succès !");
    } catch (error) {
      console.error("Erreur lors de la modification du livrable:", error);
      toast.error("Erreur lors de la modification du livrable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deliverable) return;

    setIsDeleting(true);

    await deleteDeliverable(deliverable.id);
    onOpenChange(false);
    onSuccess();
    toast.success("Livrable supprimé avec succès !");
  };

  if (!deliverable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le livrable</DialogTitle>
            <DialogDescription>Modifiez les détails de ce livrable.</DialogDescription>
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
          <DialogFooter className="gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela supprimera définitivement ce livrable et toutes les
                    soumissions associées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
