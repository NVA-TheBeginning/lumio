"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { Badge, Edit, Filter, Plus, Settings, Trash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { z } from "zod";
import {
  CreateGroupsDto,
  createGroups,
  deleteGroup,
  GroupSettingsUpdateDto,
  ProjectType,
  updateGroup,
  updateGroupSettings,
} from "@/app/dashboard/teachers/projects/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const groupSettingsSchema = z.object({
  minMembers: z.number().positive(),
  maxMembers: z.number().positive(),
  mode: z.string().refine((val) => ["MANUAL", "RANDOM", "FREE"].includes(val)),
  deadline: z.string(),
});

const createGroupsSchema = z.object({
  numberOfGroups: z.number().positive(),
  baseName: z.string().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
});

export function ProjectGroups({ project }: { project: ProjectType }) {
  const queryClient = useQueryClient();
  const [activePromotionId, setActivePromotionId] = useState<number>(project.promotions[0]?.id || 0);
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  const [showCreateGroupsDialog, setShowCreateGroupsDialog] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  const activePromotion = project.promotions.find((p) => p.id === activePromotionId);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: GroupSettingsUpdateDto) => updateGroupSettings(project.id, activePromotionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      queryClient.setQueryData(["projects", Number(project.id)], (oldData: ProjectType | undefined) => {
        if (!oldData) return oldData;
        const updatedPromotions = oldData.promotions.map((p) => {
          if (p.id === activePromotionId) {
            return { ...p, groupSettings: { ...p.groupSettings, ...settingsForm.getValues() } };
          }
          return p;
        });
        return { ...oldData, promotions: updatedPromotions };
      });

      setShowSettingsDialog(false);
    },
  });

  const createGroupsMutation = useMutation({
    mutationFn: (data: CreateGroupsDto) => createGroups(project.id, activePromotionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      setShowCreateGroupsDialog(false);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: { name: string } }) => updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      setEditingGroup(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      project.promotions.forEach((promotion) => {
        promotion.groups = promotion.groups.filter((group) => group.id !== groupToDelete);
      });
      setGroupToDelete(null);
    },
  });

  const settingsForm = useHookForm<z.infer<typeof groupSettingsSchema>>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      minMembers: activePromotion?.groupSettings?.minMembers || 1,
      maxMembers: activePromotion?.groupSettings?.maxMembers || 5,
      mode: activePromotion?.groupSettings?.mode || "FREE",
      deadline: activePromotion?.groupSettings?.deadline
        ? formatDateForInput(activePromotion?.groupSettings?.deadline)
        : formatDateForInput(new Date().toISOString()),
    },
  });

  const createGroupsForm = useHookForm<z.infer<typeof createGroupsSchema>>({
    resolver: zodResolver(createGroupsSchema),
    defaultValues: {
      numberOfGroups: 1,
      baseName: "Groupe",
    },
  });

  const updateGroupForm = useHookForm<z.infer<typeof updateGroupSchema>>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: editingGroup?.name || "",
    },
  });

  useEffect(() => {
    if (editingGroup) {
      updateGroupForm.reset({
        name: editingGroup.name,
      });
    }
  }, [editingGroup, updateGroupForm]);

  const handleUpdateSettings = (data: z.infer<typeof groupSettingsSchema>) => {
    updateSettingsMutation.mutate(data);
  };

  const handleCreateGroups = (data: z.infer<typeof createGroupsSchema>) => {
    createGroupsMutation.mutate(data);
  };

  const handleUpdateGroup = (data: z.infer<typeof updateGroupSchema>) => {
    if (editingGroup) {
      updateGroupMutation.mutate({
        groupId: Number(editingGroup.id),
        data: { name: data.name },
      });
    }
  };

  const handleDeleteGroup = (): void => {
    if (groupToDelete !== null) {
      deleteGroupMutation.mutate(groupToDelete);
    }
  };

  const handlePromotionChange = (value: string): void => {
    const promotionId = Number(value);
    setActivePromotionId(promotionId);
  };

  const getGroupModeText = (mode: string): string => {
    switch (mode) {
      case "RANDOM":
        return "Aléatoire";
      case "MANUAL":
        return "Manuel (par l'enseignant)";
      case "FREE":
        return "Libre (par les étudiants)";
      default:
        return mode;
    }
  };

  function formatDateForInput(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  const currentPromotion = project.promotions.find((p) => p.id === activePromotionId);

  const groups = currentPromotion?.groups;
  const groupSettings = currentPromotion?.groupSettings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des groupes</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs
            defaultValue={activePromotionId.toString()}
            value={activePromotionId.toString()}
            onValueChange={handlePromotionChange}
            className="w-full"
          >
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              {project.promotions.map((promotion) => (
                <TabsTrigger key={promotion.id} value={promotion.id.toString()} className="min-w-max">
                  {promotion.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {project.promotions.map((promotion) => (
              <TabsContent key={promotion.id} value={promotion.id.toString()} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{promotion.name}</h3>
                    <p className="text-sm text-muted-foreground">{promotion.description}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres des groupes
                    </h4>
                    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-2" />
                          Modifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Paramètres des groupes</DialogTitle>
                          <DialogDescription>
                            Définissez les règles de constitution des groupes pour cette promotion.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...settingsForm}>
                          <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={settingsForm.control}
                                name="minMembers"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimum d'étudiants</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={settingsForm.control}
                                name="maxMembers"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Maximum d'étudiants</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={settingsForm.control}
                              name="mode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mode de constitution</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un mode" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="MANUAL">Manuel (par l'enseignant)</SelectItem>
                                      <SelectItem value="RANDOM">Aléatoire</SelectItem>
                                      <SelectItem value="FREE">Libre (par les étudiants)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={settingsForm.control}
                              name="deadline"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date limite</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                {updateSettingsMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {groupSettings ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Mode de constitution</p>
                        <p className="text-sm">{getGroupModeText(groupSettings.mode)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Taille des groupes</p>
                        <p className="text-sm">
                          {groupSettings.minMembers} à {groupSettings.maxMembers} étudiants
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date limite</p>
                        <p className="text-sm">{formatDate(new Date(groupSettings.deadline), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">
                        Aucun paramètre de groupe défini pour cette promotion.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setShowSettingsDialog(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Définir les paramètres
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Groupes d'étudiants ({groups?.length || 0})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrer
                    </Button>
                    <Dialog open={showCreateGroupsDialog} onOpenChange={setShowCreateGroupsDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer des groupes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Créer des groupes</DialogTitle>
                          <DialogDescription>
                            Définissez le nombre de groupes à créer pour cette promotion.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...createGroupsForm}>
                          <form onSubmit={createGroupsForm.handleSubmit(handleCreateGroups)} className="space-y-4">
                            <FormField
                              control={createGroupsForm.control}
                              name="numberOfGroups"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre de groupes</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={createGroupsForm.control}
                              name="baseName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Préfixe du nom</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Groupe" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={createGroupsMutation.isPending}>
                                {createGroupsMutation.isPending ? "Création..." : "Créer"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {groups && groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <Badge>{group.members.length} étudiants</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <ul className="space-y-1">
                            {group.members.map((member) => (
                              <li key={member.id} className="text-sm flex justify-between items-center">
                                <span>
                                  {member.firstname} {member.lastname}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="bg-muted/30 py-2 flex justify-end gap-2">
                          <Dialog
                            open={editingGroup?.id === group.id}
                            onOpenChange={(open) => !open && setEditingGroup(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingGroup({ id: group.id, name: group.name })}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Modifier
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modifier le groupe</DialogTitle>
                              </DialogHeader>
                              <Form {...updateGroupForm}>
                                <form onSubmit={updateGroupForm.handleSubmit(handleUpdateGroup)} className="space-y-4">
                                  <FormField
                                    control={updateGroupForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nom du groupe</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <DialogFooter>
                                    <Button type="submit" disabled={updateGroupMutation.isPending}>
                                      {updateGroupMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={groupToDelete === group.id}
                            onOpenChange={(open) => !open && setGroupToDelete(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setGroupToDelete(group.id)}
                              >
                                <Trash className="h-3 w-3 mr-2" />
                                Supprimer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmer la suppression</DialogTitle>
                                <DialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le groupe "{group.name}" ? Cette action ne peut pas
                                  être annulée.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setGroupToDelete(null)}>
                                  Annuler
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteGroup}
                                  disabled={deleteGroupMutation.isPending}
                                >
                                  {deleteGroupMutation.isPending ? "Suppression..." : "Supprimer"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Aucun groupe n'a encore été créé</p>
                    <Button size="sm" onClick={() => setShowCreateGroupsDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer des groupes
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
