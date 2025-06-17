"use client";

import { Download, Eye, FileText, Github, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { downloadSubmission } from "@/app/dashboard/students/projects/actions";
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
import { useDeleteSubmission } from "@/hooks/use-submissions";

interface SubmissionDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    submissionId: number;
    deliverableId: number;
    fileKey: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    submissionDate: Date;
    groupId: number;
    penalty: number;
    type: string[];
    status: string;
    lastModified: Date;
    gitUrl?: string;
    error?: boolean;
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
  const deleteSubmissionMutation = useDeleteSubmission();

  const handleDelete = async () => {
    try {
      await deleteSubmissionMutation.mutateAsync(submission.submissionId);
      toast.success("Soumission supprimée avec succès");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
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

  const handleDownload = async () => {
    try {
      toast.info("Téléchargement en cours...");
      await downloadSubmission(submission.submissionId);
      toast.success("Téléchargement terminé");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const openGitRepo = () => {
    if (submission.type.includes("GIT") && submission.gitUrl) {
      const gitUrl = submission.gitUrl.startsWith("https://") ? submission.gitUrl : null;
      if (gitUrl) {
        window.open(gitUrl, "_blank");
      } else {
        toast.error("URL Git non disponible");
      }
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

            {submission.type.includes("FILE") && submission.fileKey && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">{submission.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {(submission.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </div>
            )}

            {submission.type.includes("GIT") && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span className="text-sm truncate">Dépôt Git</span>
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
          {submission.submissionId > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleteSubmissionMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteSubmissionMutation.isPending ? "Suppression..." : "Supprimer"}
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
