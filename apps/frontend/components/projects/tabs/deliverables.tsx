"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { JSX, useState } from "react";
import { DeliverableType, ProjectType, PromotionType } from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
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

  const getDeliverableStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>;
      case "active":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "upcoming":
        return <Badge variant="outline">À venir</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDeliverable = (deliverableId: number) => {
    router.push(`/dashboard/teachers/projects/${project.id}/deliverables/${deliverableId}`);
  };

  const handleEditDeliverable = (deliverable: DeliverableType) => {
    setSelectedDeliverable(deliverable);
    setShowEditDialog(true);
  };

  const getPromotionDeliverables = (promotionId: string) => {
    return project.deliverables.filter((deliverable) => deliverable.promotionId.toString() === promotionId);
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
                  getDeliverableStatusBadge={getDeliverableStatusBadge}
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
  getDeliverableStatusBadge: (status: string) => JSX.Element;
  setShowCreateDialog: (show: boolean) => void;
}

function PromotionDeliverables({
  promotion,
  deliverables,
  onEditDeliverable,
  getDeliverableStatusBadge,
  setShowCreateDialog,
}: PromotionDeliverablesProps) {
  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-muted-foreground mb-6">Aucun livrable n'a encore été défini pour cette promotion.</p>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un livrable pour {promotion.name}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deliverables.map((deliverable) => (
        <div
          key={deliverable.id}
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{deliverable.name}</h3>
              {getDeliverableStatusBadge(deliverable.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{deliverable.description}</p>
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Échéance: {formatDate(deliverable.deadline)}</span>
              </div>
              {/* <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileCheck className="h-3.5 w-3.5" />
                <span>
                  {deliverable.submissions.filter((s) => s.status === "submitted").length} / {promotion.groups.length}{" "}
                  soumis
                </span>
              </div> */}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditDeliverable(deliverable)}>
              Modifier
            </Button>
            <Button variant="outline" size="sm" disabled>
              Gérer
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
