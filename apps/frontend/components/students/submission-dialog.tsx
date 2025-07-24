"use client";

import { AlertCircle, FileUp, Github, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SubmissionData, submitDeliverable } from "@/app/dashboard/students/projects/actions";
import { DeliverableType } from "@/app/dashboard/teachers/projects/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isTruthy } from "@/lib/utils";

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: DeliverableType;
  groupId: number;
  onSuccess: () => void;
}

export function SubmissionDialog({ open, onOpenChange, deliverable, groupId, onSuccess }: SubmissionDialogProps) {
  const [submissionType, setSubmissionType] = useState<"file" | "git">("file");
  const [file, setFile] = useState<File | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const canSubmitFile = deliverable.type.includes("FILE");
  const canSubmitGit = deliverable.type.includes("GIT");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Veuillez sélectionner un fichier ZIP");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const submissionData: SubmissionData = { groupId };

      if (submissionType === "file" && file) {
        submissionData.file = file;
      } else if (submissionType === "git" && gitUrl) {
        const GIT_URL_REGEX = /^https:\/\/github\.com\/[^/]+\/[^/]+/;
        if (!GIT_URL_REGEX.test(gitUrl)) {
          toast.error("URL Git invalide. Utilisez le format: https://github.com/utilisateur/repo");
          return;
        }
        submissionData.gitUrl = gitUrl;
      } else {
        toast.error("Veuillez sélectionner un fichier ou saisir une URL Git");
        return;
      }

      await submitDeliverable(deliverable.id, submissionData);
      toast.success("Soumission envoyée avec succès !");

      setFile(null);
      setGitUrl("");
      setValidationErrors([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Erreur lors de la soumission:", error);

      if (error instanceof Error && error.message.includes("does not meet the required rules")) {
        const ruleViolations = error.message
          .split("\n")
          .filter((line: string) => isTruthy(line.trim()) && !line.includes("does not meet the required rules"))
          .map((line: string) => line.trim());

        if (ruleViolations.length > 0) {
          setValidationErrors(ruleViolations);
          toast.error("Votre soumission ne respecte pas les règles requises");
        } else {
          toast.error("Erreur lors de la soumission");
        }
      } else {
        toast.error("Erreur lors de la soumission");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Soumettre le livrable
          </DialogTitle>
          <DialogDescription>Soumettez votre travail pour "{deliverable.name}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Échéance:{" "}
              {new Date(deliverable.deadline).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
            {deliverable.allowLateSubmission && (
              <Badge variant="secondary" className="text-xs">
                Soumission tardive autorisée ({deliverable.lateSubmissionPenalty}% de pénalité)
              </Badge>
            )}
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Votre soumission ne respecte pas les règles suivantes :</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            value={submissionType}
            onValueChange={(value) => {
              setSubmissionType(value as "file" | "git");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" disabled={!canSubmitFile}>
                <FileUp className="h-4 w-4 mr-2" />
                Fichier ZIP
              </TabsTrigger>
              <TabsTrigger value="git" disabled={!canSubmitGit}>
                <Github className="h-4 w-4 mr-2" />
                Dépôt Git
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="file">Fichier ZIP</Label>
                <div className="space-y-2">
                  {file ? (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Input id="file" type="file" accept=".zip" onChange={handleFileChange} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Sélectionnez un fichier ZIP contenant votre projet</p>
              </div>
            </TabsContent>

            <TabsContent value="git" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gitUrl">URL du dépôt GitHub</Label>
                <Input
                  id="gitUrl"
                  placeholder="https://github.com/utilisateur/nom-du-repo"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">L'URL doit pointer vers un dépôt GitHub public</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Soumission en cours..." : "Soumettre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
