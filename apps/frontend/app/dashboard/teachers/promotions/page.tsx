"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { deletePromotion } from "./action";
import { usePromotions } from "./hooks";
import { PromotionSelector } from "./selector";
import { MembersTable } from "./table";

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const { data: promotions, isLoading, isError } = usePromotions();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePromotion(id),
    onSuccess: () => {
      const selectedPromotion = promotions?.find((p) => p.id === selectedPromotionId);
      toast.success(`La promotion "${selectedPromotion?.name}" a été supprimée avec succès`);

      if (promotions) {
        const remainingPromotions = promotions.filter((p) => p.id !== selectedPromotionId);
        if (remainingPromotions.length > 0) {
          setSelectedPromotionId(remainingPromotions[0]?.id ?? null);
        } else {
          setSelectedPromotionId(null);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Une erreur est survenue lors de la suppression de la promotion");
      console.error("Error deleting promotion:", error);
      setIsDeleteDialogOpen(false);
    },
  });

  useEffect(() => {
    if (!(isLoading || isError) && promotions && promotions[0] && selectedPromotionId === null) {
      setSelectedPromotionId(promotions[0].id);
    }
  }, [promotions, isLoading, isError, selectedPromotionId]);

  const selectedPromotion = promotions?.find((p) => p.id === selectedPromotionId);

  const handleDeletePromotion = () => {
    if (!selectedPromotionId) return;
    deleteMutation.mutate(selectedPromotionId);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Sélectionner une promotion</h2>
            {selectedPromotion && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la promotion
              </Button>
            )}
          </div>
          <PromotionSelector
            value={selectedPromotionId}
            onChange={setSelectedPromotionId}
            promotions={promotions || []}
            isLoading={isLoading}
            isError={isError}
          />
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Liste des étudiants de cette promotion</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPromotion && (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium">Aucune promotion sélectionnée</h3>
                <p className="text-gray-500 mt-2">Sélectionnez ou créez une promotion pour afficher les membres.</p>
                <HoverPrefetchLink href="/dashboard/teachers/promotions/new">
                  <Button className="mt-4" size="sm">
                    Créer une promotion
                  </Button>
                </HoverPrefetchLink>
              </div>
            )}
            {selectedPromotion && <MembersTable promotionId={selectedPromotionId} />}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !deleteMutation.isPending && setIsDeleteDialogOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement la promotion
              {selectedPromotion ? ` "${selectedPromotion.name}"` : ""} et tous ses membres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePromotion}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
