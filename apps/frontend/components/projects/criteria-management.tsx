"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Grid3x3, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateCriteria, useCriteria, useDeleteCriteria, useUpdateCriteria } from "@/hooks/use-criteria";
import { type Criteria, CriterionType } from "@/lib/types";

const criteriaSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  weight: z.number().min(0).max(100, "Le poids doit être entre 0 et 100"),
  type: z.nativeEnum(CriterionType),
  individual: z.boolean(),
});

type CriteriaFormData = z.infer<typeof criteriaSchema>;

interface CriterionForm {
  id: number;
  name: string;
  weight: number;
  type: CriterionType;
  individual: boolean;
}

interface CriteriaManagementProps {
  projectId: number;
  promotionId: number;
}

export function CriteriaManagement({ projectId, promotionId }: CriteriaManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gridName, setGridName] = useState("");
  const [batchCriteria, setBatchCriteria] = useState<CriterionForm[]>([]);

  const { data: criteria = [], isLoading } = useCriteria(projectId, promotionId);
  const createMutation = useCreateCriteria();
  const updateMutation = useUpdateCriteria();
  const deleteMutation = useDeleteCriteria();

  const createForm = useForm<CriteriaFormData>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      name: "",
      weight: 0,
      type: CriterionType.DELIVERABLE,
      individual: false,
    },
  });

  const editForm = useForm<CriteriaFormData>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      name: "",
      weight: 0,
      type: CriterionType.DELIVERABLE,
      individual: false,
    },
  });

  const onCreateSubmit = async (data: CriteriaFormData): Promise<void> => {
    try {
      await createMutation.mutateAsync({
        projectId,
        promotionId,
        data,
      });
      toast.success("Critère créé avec succès");
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      console.error("Error creating criteria:", error);
      toast.error("Erreur lors de la création du critère");
    }
  };

  const onUpdateSubmit = async (data: CriteriaFormData): Promise<void> => {
    if (!editingId) return;

    try {
      await updateMutation.mutateAsync({
        criteriaId: editingId,
        data,
        projectId,
        promotionId,
      });
      toast.success("Critère mis à jour avec succès");
      setEditingId(null);
      editForm.reset();
    } catch (error) {
      console.error("Error updating criteria:", error);
      toast.error("Erreur lors de la mise à jour du critère");
    }
  };

  const handleDelete = async (criteriaId: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({
        criteriaId,
        projectId,
        promotionId,
      });
      toast.success("Critère supprimé avec succès");
    } catch (error) {
      console.error("Error deleting criteria:", error);
      toast.error("Erreur lors de la suppression du critère");
    }
  };

  const handleEdit = (criterion: Criteria): void => {
    setEditingId(criterion.id);
    editForm.reset({
      name: criterion.name,
      weight: criterion.weight,
      type: criterion.type,
      individual: criterion.individual,
    });
  };

  const addBatchCriterion = (): void => {
    setBatchCriteria((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        weight: 0,
        type: CriterionType.DELIVERABLE,
        individual: false,
      },
    ]);
  };

  const updateBatchCriterion = (
    index: number,
    field: keyof CriterionForm,
    value: string | number | boolean | CriterionType,
  ): void => {
    setBatchCriteria((prev) => {
      const newCriteria = [...prev];
      newCriteria[index] = {
        ...newCriteria[index],
        [field]: value,
      } as CriterionForm;
      return newCriteria;
    });
  };

  const removeBatchCriterion = (index: number): void => {
    setBatchCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchCreate = async (): Promise<void> => {
    if (!gridName.trim() || batchCriteria.length === 0) {
      toast.error("Veuillez saisir un nom et au moins un critère");
      return;
    }

    // Validate that all criteria have names
    const hasEmptyNames = batchCriteria.some((criterion) => !criterion.name.trim());
    if (hasEmptyNames) {
      toast.error("Tous les critères doivent avoir un nom");
      return;
    }

    // Validate weights sum to 100%
    const totalWeight = batchCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (totalWeight !== 100) {
      toast.error(`Le total des poids doit être de 100% (actuellement ${totalWeight}%)`);
      return;
    }

    try {
      // Create all criteria using Promise.all for better performance
      const criteriaPromises = batchCriteria.map((criterion) => {
        const criteriaData: CriteriaFormData = {
          name: `${gridName} - ${criterion.name}`,
          weight: criterion.weight,
          type: criterion.type,
          individual: criterion.individual,
        };

        return createMutation.mutateAsync({
          projectId,
          promotionId,
          data: criteriaData,
        });
      });

      await Promise.all(criteriaPromises);

      toast.success("Grille créée avec succès");
      setGridName("");
      setBatchCriteria([]);
      setIsBatchCreateOpen(false);
    } catch (error) {
      console.error("Error creating criteria grid:", error);
      toast.error("Erreur lors de la création de la grille");
    }
  };

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const isWeightValid = totalWeight === 100;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Critères d'évaluation</h2>
          <p className="text-muted-foreground">Définissez les critères de notation pour ce projet</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un critère
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau critère</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du critère</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Qualité du code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CriterionType.DELIVERABLE}>Livrable</SelectItem>
                            <SelectItem value={CriterionType.REPORT}>Rapport</SelectItem>
                            <SelectItem value={CriterionType.PRESENTATION}>Présentation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="individual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Évaluation individuelle</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Évaluer chaque membre du groupe individuellement
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Création..." : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isBatchCreateOpen} onOpenChange={setIsBatchCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Créer une grille
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une grille de notation</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label htmlFor="grid-name" className="text-sm font-medium">
                    Nom de la grille
                  </label>
                  <Input
                    id="grid-name"
                    value={gridName}
                    onChange={(e) => setGridName(e.target.value)}
                    placeholder="Ex: Soutenance finale"
                  />
                </div>

                <div className="space-y-4">
                  {batchCriteria.map((criterion, index) => (
                    <div key={criterion.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium" htmlFor={`criterion-name-${index}`}>
                          Nom
                        </label>
                        <Input
                          id={`criterion-name-${index}`}
                          value={criterion.name}
                          onChange={(e) => updateBatchCriterion(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium" htmlFor={`criterion-weight-${index}`}>
                          Poids (%)
                        </label>
                        <Input
                          id={`criterion-weight-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          value={criterion.weight}
                          onChange={(e) => updateBatchCriterion(index, "weight", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium" htmlFor={`criterion-type-${index}`}>
                          Type
                        </label>
                        <Select
                          value={criterion.type}
                          onValueChange={(val) => updateBatchCriterion(index, "type", val as CriterionType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CriterionType.DELIVERABLE}>Livrable</SelectItem>
                            <SelectItem value={CriterionType.REPORT}>Rapport</SelectItem>
                            <SelectItem value={CriterionType.PRESENTATION}>Présentation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={criterion.individual}
                          onCheckedChange={(val) => updateBatchCriterion(index, "individual", val)}
                        />
                        <span className="text-sm">Individuel</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBatchCriterion(index)}
                          aria-label="Supprimer le critère"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addBatchCriterion}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter un critère
                  </Button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsBatchCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleBatchCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Création..." : "Créer la grille"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Critères configurés</span>
            <div className={`text-sm ${isWeightValid ? "text-green-600" : "text-red-600"}`}>
              Total: {totalWeight}% {!isWeightValid && "(doit être égal à 100%)"}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criteria.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun critère défini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <Card key={criterion.id} className="p-4">
                  {editingId === criterion.id ? (
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Poids (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={CriterionType.DELIVERABLE}>Livrable</SelectItem>
                                    <SelectItem value={CriterionType.REPORT}>Rapport</SelectItem>
                                    <SelectItem value={CriterionType.PRESENTATION}>Présentation</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="individual"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <FormLabel>Individuel</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                          </Button>
                          <Button type="submit" disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{criterion.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              criterion.type === CriterionType.DELIVERABLE
                                ? "bg-blue-100 text-blue-800"
                                : criterion.type === CriterionType.REPORT
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {criterion.type === CriterionType.DELIVERABLE
                              ? "Livrable"
                              : criterion.type === CriterionType.REPORT
                                ? "Rapport"
                                : "Présentation"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              criterion.individual ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {criterion.individual ? "Individuel" : "Groupe"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Poids: {criterion.weight}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(criterion)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(criterion.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CriteriaManagement;
