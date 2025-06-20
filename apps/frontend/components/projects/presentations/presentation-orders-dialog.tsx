"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Calendar, Clock, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CreateOrderData,
  createOrder,
  deleteOrder,
  getOrders,
  OrderType,
  PresentationType,
  PromotionType,
  UpdateOrderData,
  updateOrder,
} from "@/app/dashboard/teachers/projects/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatDateTime } from "@/lib/utils";

interface PresentationOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentation: PresentationType | null;
  promotion: PromotionType | undefined;
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

export function PresentationOrdersDialog({
  open,
  onOpenChange,
  presentation,
  promotion,
}: PresentationOrdersDialogProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("");

  // Get orders for this presentation
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", presentation?.id],
    queryFn: () => getOrders(presentation?.id ?? 0),
    enabled: !!presentation,
  });

  // Get groups that are not yet assigned to this presentation
  const assignedGroupIds = new Set(orders?.map((order) => order.groupId) || []);
  const availableGroups = promotion?.groups.filter((group) => !assignedGroupIds.has(group.id)) || [];

  // Merge orders with group information
  const ordersWithGroups: OrderWithGroup[] = (orders || [])
    .map((order) => ({
      ...order,
      group: promotion?.groups.find((group) => group.id === order.groupId),
    }))
    .sort((a, b) => a.orderNumber - b.orderNumber);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateOrderData) => {
      if (!presentation) throw new Error("No presentation selected");
      return createOrder(presentation.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", presentation?.id] });
      toast.success("Ordre ajouté avec succès");
      setShowAddForm(false);
      setSelectedGroupId(null);
      setSelectedTime("");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout de l'ordre");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderData }) => updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", presentation?.id] });
      toast.success("Ordre mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", presentation?.id] });
      toast.success("Ordre supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleDragEnd = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !orders) return;

    const items = Array.from(ordersWithGroups);
    const reorderedItem = items.splice(fromIndex, 1)[0];
    if (!reorderedItem) return;

    items.splice(toIndex, 0, reorderedItem);

    // Update order numbers based on new positions
    items.forEach((item, index) => {
      if (item.orderNumber !== index + 1) {
        updateMutation.mutate({
          id: item.id,
          data: { orderNumber: index + 1 },
        });
      }
    });
  };

  const moveOrderUp = (index: number) => {
    if (index > 0) {
      handleDragEnd(index, index - 1);
    }
  };

  const moveOrderDown = (index: number) => {
    if (index < ordersWithGroups.length - 1) {
      handleDragEnd(index, index + 1);
    }
  };

  const handleAddOrder = () => {
    if (!selectedGroupId) return;
    if (!selectedTime) return;
    if (!presentation) return;

    const nextOrderNumber = Math.max(0, ...(orders?.map((o) => o.orderNumber) || [])) + 1;

    createMutation.mutate({
      presentationId: presentation.id,
      groupId: selectedGroupId,
      orderNumber: nextOrderNumber,
      scheduledDatetime: selectedTime,
    });
  };

  const handleDeleteOrder = (orderId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ordre de passage ?")) {
      deleteMutation.mutate(orderId);
    }
  };

  const calculateScheduledTime = (orderNumber: number) => {
    if (!presentation?.startDatetime) return "";

    const startTime = new Date(presentation.startDatetime);
    const scheduledTime = new Date(startTime.getTime() + (orderNumber - 1) * presentation.durationPerGroup * 60000);

    return scheduledTime.toISOString().slice(0, 16);
  };

  const autoScheduleAll = () => {
    ordersWithGroups.forEach((order, index) => {
      const scheduledTime = calculateScheduledTime(index + 1);
      if (order.scheduledDatetime !== scheduledTime) {
        updateMutation.mutate({
          id: order.id,
          data: { scheduledDatetime: scheduledTime },
        });
      }
    });
  };

  if (!presentation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ordre de passage - {formatDate(presentation.startDatetime)}</DialogTitle>
          <DialogDescription>
            Gérez l'ordre de passage des groupes pour cette soutenance. Vous pouvez réorganiser par glisser-déposer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Presentation Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informations de la soutenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Début: {formatDateTime(presentation.startDatetime)}</span>
                </div>
                {presentation.endDatetime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Fin: {formatDateTime(presentation.endDatetime)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{presentation.durationPerGroup} min par groupe</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)} disabled={availableGroups.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un groupe
            </Button>
            {ordersWithGroups.length > 0 && (
              <Button variant="outline" onClick={autoScheduleAll}>
                <Clock className="mr-2 h-4 w-4" />
                Programmer automatiquement
              </Button>
            )}
          </div>

          {/* Add Order Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ajouter un groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="group">Groupe</Label>
                  <select
                    id="group"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedGroupId || ""}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value) || null)}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.members.length} membres)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="time">Heure programmée</Label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    placeholder={calculateScheduledTime(ordersWithGroups.length + 1)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddOrder}
                    disabled={selectedGroupId === null || selectedTime === "" || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : ordersWithGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun groupe programmé</h3>
              <p className="mt-2 text-muted-foreground">Ajoutez des groupes pour définir l'ordre de passage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersWithGroups.map((order, index) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOrderUp(index)}
                            disabled={index === 0 || updateMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOrderDown(index)}
                            disabled={index === ordersWithGroups.length - 1 || updateMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Badge variant="outline" className="min-w-[40px] justify-center">
                          #{order.orderNumber}
                        </Badge>
                        <div>
                          <div className="font-medium">{order.group?.name || `Groupe ${order.groupId}`}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.group?.members.length || 0} membres
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDateTime(order.scheduledDatetime)}</div>
                          <div className="text-xs text-muted-foreground">Programmé</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
