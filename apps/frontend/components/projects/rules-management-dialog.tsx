"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createRule,
  DeliverableRule,
  DeliverableType,
  DirectoryStructureRuleDetails,
  deleteRule,
  FilePresenceRuleDetails,
  getDeliverableRules,
  SizeLimitRuleDetails,
} from "@/app/dashboard/teachers/projects/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface RulesManagementDialogProps {
  children: React.ReactNode;
  deliverable: DeliverableType;
}

enum RuleType {
  SIZE_LIMIT = "SIZE_LIMIT",
  FILE_PRESENCE = "FILE_PRESENCE",
  DIRECTORY_STRUCTURE = "DIRECTORY_STRUCTURE",
}

export function RulesManagementDialog({ children, deliverable }: RulesManagementDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>(RuleType.SIZE_LIMIT);
  const [maxSizeInBytes, setMaxSizeInBytes] = useState(10485760); // 10MB default
  const [requiredFiles, setRequiredFiles] = useState("");
  const [allowedExtensions, setAllowedExtensions] = useState("");
  const [forbiddenExtensions, setForbiddenExtensions] = useState("");
  const [requiredDirectories, setRequiredDirectories] = useState("");
  const [forbiddenDirectories, setForbiddenDirectories] = useState("");

  const {
    data: rules = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["deliverable-rules", deliverable.id],
    queryFn: () => getDeliverableRules(deliverable.id),
    enabled: open,
  });

  const createRuleMutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      toast.success("Règle créée avec succès");
      setShowCreateForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["deliverable-rules", deliverable.id] });
    },
    onError: (error) => {
      console.error("Failed to create rule:", error);
      toast.error("Erreur lors de la création de la règle");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteRule,
    onMutate: async (ruleId) => {
      await queryClient.cancelQueries({ queryKey: ["deliverable-rules", deliverable.id] });

      const previousRules = queryClient.getQueryData<DeliverableRule[]>(["deliverable-rules", deliverable.id]);

      queryClient.setQueryData<DeliverableRule[]>(
        ["deliverable-rules", deliverable.id],
        (old) => old?.filter((rule) => rule.id !== ruleId) || [],
      );

      return { previousRules };
    },
    onSuccess: () => {
      toast.success("Règle supprimée avec succès");
    },
    onError: (error, _ruleId, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(["deliverable-rules", deliverable.id], context.previousRules);
      }
      console.error("Failed to delete rule:", error);
      toast.error("Erreur lors de la suppression de la règle");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-rules", deliverable.id] });
    },
  });

  const resetForm = () => {
    setSelectedRuleType(RuleType.SIZE_LIMIT);
    setMaxSizeInBytes(10485760);
    setRequiredFiles("");
    setAllowedExtensions("");
    setForbiddenExtensions("");
    setRequiredDirectories("");
    setForbiddenDirectories("");
  };

  const handleCreateRule = async () => {
    try {
      let ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;

      switch (selectedRuleType) {
        case RuleType.SIZE_LIMIT:
          ruleDetails = { maxSizeInBytes };
          break;
        case RuleType.FILE_PRESENCE:
          ruleDetails = {
            requiredFiles: requiredFiles
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f),
            allowedExtensions: allowedExtensions
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e),
            forbiddenExtensions: forbiddenExtensions
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e),
          };
          break;
        case RuleType.DIRECTORY_STRUCTURE:
          ruleDetails = {
            requiredDirectories: requiredDirectories
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d),
            forbiddenDirectories: forbiddenDirectories
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d),
          };
          break;
        default:
          throw new Error("Type de règle non supporté");
      }

      createRuleMutation.mutate({
        deliverableId: deliverable.id,
        ruleType: selectedRuleType,
        ruleDetails,
      });
    } catch (error) {
      console.error("Failed to create rule:", error);
      toast.error("Erreur lors de la création de la règle");
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    deleteRuleMutation.mutate(ruleId);
  };

  const formatRuleDetails = (rule: DeliverableRule) => {
    const details = rule.ruleDetails;

    switch (rule.ruleType) {
      case RuleType.SIZE_LIMIT: {
        let parsedDetails: SizeLimitRuleDetails;

        if (typeof details === "string") {
          try {
            parsedDetails = JSON.parse(details) as SizeLimitRuleDetails;
          } catch {
            return "Erreur de format des données";
          }
        } else {
          parsedDetails = details as SizeLimitRuleDetails;
        }

        const maxSizeValue = parsedDetails.maxSizeInBytes;

        if (!maxSizeValue || Number.isNaN(maxSizeValue) || maxSizeValue <= 0) {
          return "Aucune limite de taille définie";
        }

        return `Taille max: ${(maxSizeValue / 1024 / 1024).toFixed(1)} MB`;
      }

      case RuleType.FILE_PRESENCE: {
        let parsedDetails: FilePresenceRuleDetails;

        if (typeof details === "string") {
          try {
            parsedDetails = JSON.parse(details) as FilePresenceRuleDetails;
          } catch {
            return "Erreur de format des données";
          }
        } else {
          parsedDetails = details as FilePresenceRuleDetails;
        }

        const parts: string[] = [];
        if (parsedDetails.requiredFiles?.length) {
          parts.push(`Fichiers requis: ${parsedDetails.requiredFiles.join(", ")}`);
        }
        if (parsedDetails.allowedExtensions?.length) {
          parts.push(`Extensions autorisées: ${parsedDetails.allowedExtensions.join(", ")}`);
        }
        if (parsedDetails.forbiddenExtensions?.length) {
          parts.push(`Extensions interdites: ${parsedDetails.forbiddenExtensions.join(", ")}`);
        }
        return parts.join(" | ");
      }

      case RuleType.DIRECTORY_STRUCTURE: {
        let parsedDetails: DirectoryStructureRuleDetails;

        if (typeof details === "string") {
          try {
            parsedDetails = JSON.parse(details) as DirectoryStructureRuleDetails;
          } catch {
            return "Erreur de format des données";
          }
        } else {
          parsedDetails = details as DirectoryStructureRuleDetails;
        }

        const dirParts: string[] = [];
        if (parsedDetails.requiredDirectories?.length) {
          dirParts.push(`Dossiers requis: ${parsedDetails.requiredDirectories.join(", ")}`);
        }
        if (parsedDetails.forbiddenDirectories?.length) {
          dirParts.push(`Dossiers interdits: ${parsedDetails.forbiddenDirectories.join(", ")}`);
        }
        return dirParts.join(" | ");
      }

      default:
        return "Détails non disponibles";
    }
  };

  const getRuleTypeLabel = (ruleType: RuleType) => {
    switch (ruleType) {
      case RuleType.SIZE_LIMIT:
        return "Limite de taille";
      case RuleType.FILE_PRESENCE:
        return "Présence de fichiers";
      case RuleType.DIRECTORY_STRUCTURE:
        return "Structure de dossiers";
      default:
        return ruleType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des règles</DialogTitle>
          <DialogDescription>Définissez et gérez les règles de validation pour ce livrable.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Règles existantes</h3>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une règle
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement des règles...</span>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-red-600">
                Erreur lors du chargement des règles. Veuillez réessayer.
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Aucune règle définie pour ce livrable.</div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getRuleTypeLabel(rule.ruleType)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatRuleDetails(rule)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleteRuleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showCreateForm && (
            <div>
              <Separator className="mb-6" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Créer une nouvelle règle</h3>
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ruleType">Type de règle</Label>
                    <Select value={selectedRuleType} onValueChange={(value: RuleType) => setSelectedRuleType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RuleType.SIZE_LIMIT}>Limite de taille</SelectItem>
                        <SelectItem value={RuleType.FILE_PRESENCE}>Présence de fichiers</SelectItem>
                        <SelectItem value={RuleType.DIRECTORY_STRUCTURE}>Structure de dossiers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRuleType === RuleType.SIZE_LIMIT && (
                    <div>
                      <Label htmlFor="maxSize">Taille maximale (en bytes)</Label>
                      <Input
                        id="maxSize"
                        type="number"
                        value={maxSizeInBytes}
                        onChange={(e) => setMaxSizeInBytes(Number(e.target.value) ?? 0)}
                        placeholder="10485760"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {maxSizeInBytes && !Number.isNaN(maxSizeInBytes) ? (
                          <>Taille actuelle: {(maxSizeInBytes / 1024 / 1024).toFixed(1)} MB</>
                        ) : (
                          "Aucune limite de taille définie"
                        )}
                      </p>
                    </div>
                  )}

                  {selectedRuleType === RuleType.FILE_PRESENCE && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="requiredFiles">Fichiers requis (séparés par des virgules)</Label>
                        <Textarea
                          id="requiredFiles"
                          value={requiredFiles}
                          onChange={(e) => setRequiredFiles(e.target.value)}
                          placeholder="README.md, src/main.js, package.json"
                        />
                      </div>
                      <div>
                        <Label htmlFor="allowedExtensions">Extensions autorisées (séparées par des virgules)</Label>
                        <Input
                          id="allowedExtensions"
                          value={allowedExtensions}
                          onChange={(e) => setAllowedExtensions(e.target.value)}
                          placeholder=".js, .ts, .json, .md"
                        />
                      </div>
                      <div>
                        <Label htmlFor="forbiddenExtensions">Extensions interdites (séparées par des virgules)</Label>
                        <Input
                          id="forbiddenExtensions"
                          value={forbiddenExtensions}
                          onChange={(e) => setForbiddenExtensions(e.target.value)}
                          placeholder=".exe, .bat, .sh"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRuleType === RuleType.DIRECTORY_STRUCTURE && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="requiredDirectories">Dossiers requis (séparés par des virgules)</Label>
                        <Textarea
                          id="requiredDirectories"
                          value={requiredDirectories}
                          onChange={(e) => setRequiredDirectories(e.target.value)}
                          placeholder="src, tests, docs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="forbiddenDirectories">Dossiers interdits (séparés par des virgules)</Label>
                        <Input
                          id="forbiddenDirectories"
                          value={forbiddenDirectories}
                          onChange={(e) => setForbiddenDirectories(e.target.value)}
                          placeholder="node_modules, .git, dist"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                      {createRuleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer la règle"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
