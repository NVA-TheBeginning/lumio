"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookCheck, Copy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyCriteria, type ProjectWithCriteria } from "@/app/dashboard/teachers/evaluations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValidNumber } from "@/lib/utils";

interface CopyCriteriaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProject?: ProjectWithCriteria;
  targetProject?: ProjectWithCriteria;
}

export function CopyCriteriaDialog({ isOpen, onClose, sourceProject, targetProject }: CopyCriteriaDialogProps) {
  const queryClient = useQueryClient();
  const [selectedSourcePromotion, setSelectedSourcePromotion] = useState<number | null>(null);
  const [selectedTargetPromotion, setSelectedTargetPromotion] = useState<number | null>(null);

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (
        !(
          sourceProject &&
          targetProject &&
          isValidNumber(selectedSourcePromotion) &&
          isValidNumber(selectedTargetPromotion)
        )
      ) {
        throw new Error("Missing required information");
      }

      return await copyCriteria(sourceProject.id, selectedSourcePromotion, targetProject.id, selectedTargetPromotion);
    },
    onSuccess: (newCriteria) => {
      toast.success(`${newCriteria.length} critères copiés avec succès`);
      void queryClient.invalidateQueries({ queryKey: ["evaluations-projects"] });
      handleClose();
    },
    onError: (error) => {
      console.error("Error copying criteria:", error);
      toast.error("Erreur lors de la copie des critères");
    },
  });

  const handleClose = () => {
    setSelectedSourcePromotion(null);
    setSelectedTargetPromotion(null);
    onClose();
  };

  const handleCopy = () => {
    copyMutation.mutate();
  };

  const sourcePromotionsWithCriteria =
    sourceProject?.promotions.filter((promotion) => promotion.criteria && promotion.criteria.length > 0) || [];

  const targetPromotionsWithoutCriteria =
    targetProject?.promotions.filter((promotion) => !promotion.criteria || promotion.criteria.length === 0) || [];

  const selectedSourcePromotionData = sourcePromotionsWithCriteria.find((p) => p.id === selectedSourcePromotion);

  const _selectedTargetPromotionData = targetPromotionsWithoutCriteria.find((p) => p.id === selectedTargetPromotion);

  const canCopy =
    isValidNumber(selectedSourcePromotion) &&
    isValidNumber(selectedTargetPromotion) &&
    selectedSourcePromotionData?.criteria &&
    selectedSourcePromotionData.criteria.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copier les critères d'évaluation
          </DialogTitle>
          <DialogDescription>Copiez les critères d'évaluation d'un projet vers un autre projet</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source and Target Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookCheck className="h-4 w-4 text-green-600" />
                  Projet source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{sourceProject?.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{sourceProject?.description}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  Projet cible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{targetProject?.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{targetProject?.description}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Promotion Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-promotion">Promotion source</Label>
              <Select
                value={selectedSourcePromotion?.toString() || ""}
                onValueChange={(value) => setSelectedSourcePromotion(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une promotion" />
                </SelectTrigger>
                <SelectContent>
                  {sourcePromotionsWithCriteria.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{promotion.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {promotion.criteria?.length || 0} critères
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-promotion">Promotion cible</Label>
              <Select
                value={selectedTargetPromotion?.toString() || ""}
                onValueChange={(value) => setSelectedTargetPromotion(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une promotion" />
                </SelectTrigger>
                <SelectContent>
                  {targetPromotionsWithoutCriteria.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {promotion.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Criteria Preview */}
          {selectedSourcePromotionData?.criteria && selectedSourcePromotionData.criteria.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Aperçu des critères à copier</CardTitle>
                <CardDescription>
                  {selectedSourcePromotionData.criteria.length} critère
                  {selectedSourcePromotionData.criteria.length > 1 ? "s" : ""} sera
                  {selectedSourcePromotionData.criteria.length > 1 ? "ont" : ""} copié
                  {selectedSourcePromotionData.criteria.length > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedSourcePromotionData.criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{criterion.name}</span>
                        <Badge variant={criterion.individual ? "default" : "secondary"} className="text-xs">
                          {criterion.individual ? "Individuel" : "Groupe"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {criterion.weight}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={copyMutation.isPending}>
              Annuler
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!canCopy || copyMutation.isPending}
              className="flex items-center gap-2"
            >
              {copyMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copyMutation.isPending ? "Copie en cours..." : "Copier les critères"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
