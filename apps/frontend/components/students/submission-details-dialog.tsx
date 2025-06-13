"use client";

import { Download, Eye, FileText, Github, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteSubmission } from "@/app/dashboard/students/projects/actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubmissionDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: number;
    deliverableId: number;
    status: string;
    penalty: number;
    submissionDate: string;
    fileUrl?: string;
    gitUrl?: string;
  };
  deliverable: {
    id: number;
    name: string;
    type: string[];
  };
  onSuccess: () => void;
}

export function SubmissionDetailsDialog({
  open,
  onOpenChange,
  submission,
  deliverable,
  onSuccess,
}: SubmissionDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteSubmission(submission.deliverableId, submission.id);
      toast.success("Soumission supprimée avec succès");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return <Badge className="bg-green-500">Validé</Badge>;
      case "late":
        return <Badge className="bg-orange-500">En retard</Badge>;
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = () => {
    // TODO: Implémenter le téléchargement du fichier
    toast.info("Téléchargement en cours...");
  };

  const openGitRepo = () => {
    if (submission.gitUrl) {
      window.open(submission.gitUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Détails de la soumission
          </DialogTitle>
          <DialogDescription>Soumission pour "{deliverable.name}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Statut</div>
              <div className="mt-1">{getStatusBadge(submission.status)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Date de soumission</div>
              <p className="mt-1 text-sm">
                {new Date(submission.submissionDate).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {submission.penalty > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Pénalité</div>
              <p className="mt-1 text-sm text-orange-600">{submission.penalty}% de pénalité pour soumission tardive</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Type de soumission</div>

            {submission.fileUrl && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Fichier ZIP</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </div>
            )}

            {submission.gitUrl && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span className="text-sm truncate">{submission.gitUrl}</span>
                </div>
                <Button size="sm" variant="outline" onClick={openGitRepo}>
                  <Github className="h-4 w-4 mr-1" />
                  Ouvrir
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {submission.id > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette soumission ? Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
