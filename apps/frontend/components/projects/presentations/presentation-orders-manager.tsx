"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Clock, Download, GripVertical, Shuffle, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getOrders,
  OrderType,
  PresentationType,
  PromotionType,
  SaveOrdersData,
  saveOrders,
} from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportPresentationOrdersToPDF } from "@/lib/pdf-export";
import { formatDateTime } from "@/lib/utils";

interface PresentationOrdersManagerProps {
  presentation: PresentationType;
  promotion: PromotionType;
}

interface OrderWithGroup extends OrderType {
  group?: {
    id: number;
    name: string;
    members: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
    }[];
  };
}

export function PresentationOrdersManager({ presentation, promotion }: PresentationOrdersManagerProps) {
  const queryClient = useQueryClient();
  const [localOrders, setLocalOrders] = useState<OrderWithGroup[]>([]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", presentation.id],
    queryFn: () => getOrders(presentation.id),
    enabled: !!presentation,
  });

  const assignedGroupIds = new Set(orders?.map((order) => order.groupId) || []);
  const allGroups = promotion.groups || [];
  const unassignedGroups = allGroups.filter((group) => !assignedGroupIds.has(group.id));

  const ordersWithGroups: OrderWithGroup[] = useMemo(
    () =>
      (orders || [])
        .map((order) => ({
          ...order,
          group: promotion.groups.find((group) => group.id === order.groupId),
        }))
        .sort((a, b) => a.orderNumber - b.orderNumber),
    [orders, promotion.groups],
  );

  useEffect(() => {
    setLocalOrders(ordersWithGroups);
  }, [ordersWithGroups]);

  const initializeOrdersMutation = useMutation({
    mutationFn: () => {
      if (!presentation) throw new Error("No presentation");
      if (!allGroups.length) throw new Error("No groups");
      const allGroupIds = allGroups.map((group) => group.id);
      return saveOrders(presentation.id, { groupIds: allGroupIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", presentation.id] });
      toast.success("Ordre de passage initialisé");
    },
    onError: () => {
      toast.error("Erreur lors de l'initialisation");
    },
  });

  const saveOrdersMutation = useMutation({
    mutationFn: (data: SaveOrdersData) => {
      if (!presentation) throw new Error("No presentation selected");
      return saveOrders(presentation.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", presentation.id] });
      toast.success("Ordre sauvegardé");
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  const handleDragEnd = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !localOrders.length) return;

    const items = Array.from(localOrders);
    const reorderedItem = items.splice(fromIndex, 1)[0];
    if (!reorderedItem) return;

    items.splice(toIndex, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderNumber: index + 1,
    }));

    setLocalOrders(updatedItems);
  };

  const moveOrderUp = (index: number) => {
    if (index > 0) {
      handleDragEnd(index, index - 1);
    }
  };

  const moveOrderDown = (index: number) => {
    if (index < localOrders.length - 1) {
      handleDragEnd(index, index + 1);
    }
  };

  const handleInitializeOrders = () => {
    initializeOrdersMutation.mutate();
  };

  const handleSaveCurrentOrder = () => {
    const currentGroupIds = localOrders.map((order) => order.groupId);
    saveOrdersMutation.mutate({ groupIds: currentGroupIds });
  };

  const handleShuffleGroups = () => {
    if (!allGroups.length) return;

    const shuffledGroupIds = [...allGroups].sort(() => Math.random() - 0.5).map((group) => group.id);

    const optimisticOrders = shuffledGroupIds.map((groupId, index) => ({
      id: localOrders.find((order) => order.groupId === groupId)?.id || 0,
      groupId,
      orderNumber: index + 1,
      presentationId: presentation.id,
      scheduledDatetime: "",
      createdAt: "",
      updatedAt: "",
      group: allGroups.find((group) => group.id === groupId),
    }));

    setLocalOrders(optimisticOrders);

    saveOrdersMutation.mutate(
      { groupIds: shuffledGroupIds },
      {
        onError: () => {
          setLocalOrders(ordersWithGroups);
        },
      },
    );
  };

  const handleExportPDF = async () => {
    if (!localOrders.length) {
      toast.error("Aucun ordre de passage à exporter");
      return;
    }

    try {
      await exportPresentationOrdersToPDF({
        presentation,
        promotion,
        orders: localOrders,
      });
      toast.success("PDF exporté avec succès");
    } catch (_error) {
      toast.error("Erreur lors de l'export du PDF");
    }
  };

  const calculateScheduledTime = (orderNumber: number) => {
    if (!presentation.startDatetime) return "";

    const startTime = new Date(presentation.startDatetime);
    const scheduledTime = new Date(startTime.getTime() + (orderNumber - 1) * presentation.durationPerGroup * 60000);

    return formatDateTime(scheduledTime.toISOString());
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex === dropIndex || Number.isNaN(dragIndex)) return;

    handleDragEnd(dragIndex, dropIndex);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {unassignedGroups.length > 0 ? (
          <Button onClick={handleInitializeOrders} disabled={initializeOrdersMutation.isPending}>
            <Users className="mr-2 h-4 w-4" />
            {initializeOrdersMutation.isPending ? "Initialisation..." : "Initialiser l'ordre de passage"}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleShuffleGroups} disabled={saveOrdersMutation.isPending}>
              <Shuffle className="mr-2 h-4 w-4" />
              Mélanger
            </Button>
            <Button variant="outline" onClick={handleSaveCurrentOrder} disabled={saveOrdersMutation.isPending}>
              <Clock className="mr-2 h-4 w-4" />
              Sauvegarder l'ordre
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!localOrders.length}>
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ordre de passage des groupes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : localOrders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun ordre de passage défini</h3>
              <p className="mt-2 text-muted-foreground">Initialisez l'ordre de passage pour tous les groupes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localOrders.map((order, index) => (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOrderUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOrderDown(index)}
                            disabled={index === localOrders.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="min-w-[40px] justify-center">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium">{order.group?.name || `Groupe ${order.groupId}`}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.group?.members.length || 0} membres
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{calculateScheduledTime(index + 1)}</div>
                        <div className="text-xs text-muted-foreground">Programmé</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
