"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeliverableType, ProjectType, PromotionType } from "@/app/dashboard/teachers/projects/actions";
import { RulesManagementDialog } from "@/components/projects/rules-management-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { CreateDeliverableDialog } from "../create-deliverables";
import { EditDeliverableDialog } from "../edit-deliverable";

interface ProjectDeliverablesProps {
  project: ProjectType;
}

export function ProjectDeliverables({ project }: ProjectDeliverablesProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activePromotion, setActivePromotion] = useState<string | undefined>(project.promotions[0]?.id.toString());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableType | null>(null);

  const refreshProjectData = () => {
    queryClient.invalidateQueries({
      queryKey: ["projects", Number(project.id)],
    });
  };

  const handleViewDeliverable = (deliverableId: number) => {
    router.push(`/dashboard/teachers/projects/${project.id}/deliverables/${deliverableId}`);
  };

  const handleEditDeliverable = (deliverable: DeliverableType) => {
    setSelectedDeliverable(deliverable);
    setShowEditDialog(true);
  };

  const handleViewSubmissions = (promotion: PromotionType) => {
    router.push(`/dashboard/teachers/projects/${project.id}/submissions?promotionId=${promotion.id}`);
  };

  const handleViewDeliverableSubmissions = (deliverableId: number, promotionId: number) => {
    router.push(
      `/dashboard/teachers/projects/${project.id}/submissions?promotionId=${promotionId}&deliverableId=${deliverableId}`,
    );
  };

  const getPromotionDeliverables = (promotionId: string) => {
    return project.deliverables.filter((deliverable) => deliverable.promotionId === Number(promotionId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des livrables</h1>
          <p className="text-muted-foreground">Définissez et suivez les livrables du projet pour chaque promotion</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <Tabs value={activePromotion} onValueChange={setActivePromotion}>
            <TabsList className="mb-6">
              {project.promotions.map((promotion) => (
                <TabsTrigger key={promotion.id} value={promotion.id.toString()}>
                  {promotion.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {project.promotions.map((promotion) => (
              <TabsContent key={promotion.id} value={promotion.id.toString()}>
                <PromotionDeliverables
                  promotion={promotion}
                  deliverables={getPromotionDeliverables(promotion.id.toString())}
                  onViewDeliverable={handleViewDeliverable}
                  onEditDeliverable={handleEditDeliverable}
                  onViewSubmissions={handleViewSubmissions}
                  onViewDeliverableSubmissions={handleViewDeliverableSubmissions}
                  setShowCreateDialog={setShowCreateDialog}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <CreateDeliverableDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        project={project}
        onSuccess={refreshProjectData}
      />

      <EditDeliverableDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        deliverable={selectedDeliverable}
        project={project}
        onSuccess={refreshProjectData}
      />
    </div>
  );
}

interface PromotionDeliverablesProps {
  promotion: PromotionType;
  deliverables: DeliverableType[];
  onViewDeliverable: (id: number) => void;
  onEditDeliverable: (deliverable: DeliverableType) => void;
  onViewSubmissions: (promotion: PromotionType) => void;
  onViewDeliverableSubmissions: (deliverableId: number, promotionId: number) => void;
  setShowCreateDialog: (show: boolean) => void;
}

function PromotionDeliverables({
  promotion,
  deliverables,
  onEditDeliverable,
  onViewSubmissions,
  onViewDeliverableSubmissions,
  setShowCreateDialog,
}: PromotionDeliverablesProps) {
  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-muted-foreground mb-6">Aucun livrable n'a encore été défini pour cette promotion.</p>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un livrable pour {promotion.name}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Livrables de {promotion.name}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un livrable
          </Button>
          <Button variant="outline" onClick={() => onViewSubmissions(promotion)}>
            <Users className="mr-2 h-4 w-4" />
            Voir toutes les soumissions
          </Button>
        </div>
      </div>

      {deliverables.map((deliverable) => (
        <div
          key={deliverable.id}
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{deliverable.name}</h3>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Échéance: {formatDate(deliverable.deadline)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditDeliverable(deliverable)}>
              Modifier
            </Button>
            <RulesManagementDialog deliverable={deliverable}>
              <Button variant="outline" size="sm">
                Règles
              </Button>
            </RulesManagementDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDeliverableSubmissions(deliverable.id, promotion.id)}
            >
              Soumissions
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
