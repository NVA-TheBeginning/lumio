"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import {
  AlertCircle,
  Badge,
  Clock,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Settings,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { z } from "zod";
import {
  addMembersToGroup,
  type CreateGroupsDto,
  createGroups,
  deleteGroup,
  type GroupSettingsUpdateDto,
  getPromoStudent,
  type ProjectType,
  removeMemberFromGroup,
  updateGroup,
  updateGroupSettings,
} from "@/app/dashboard/teachers/projects/actions";
import type { Member } from "@/app/dashboard/teachers/promotions/action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

  const { data: allStudents = [] } = useQuery({
    queryKey: ["promotion-students", activePromotionId],
    queryFn: () => getPromoStudent(activePromotionId),
    enabled: !!activePromotionId,
  });

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

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, studentIds }: { groupId: number; studentIds: number[] }) =>
      addMembersToGroup(groupId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) => removeMemberFromGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
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

  const unassignedStudents = useMemo((): Member[] => {
    if (!allStudents || allStudents.length === 0) return [];
    if (!groups || groups.length === 0) return allStudents;

    const assignedStudentIds = new Set(groups.flatMap((group) => group.members.map((member) => member.id)));
    return allStudents.filter((student) => !assignedStudentIds.has(student.id));
  }, [allStudents, groups]);

  const handleAddStudentToGroup = (groupId: number, studentId: number) => {
    addMemberMutation.mutate({ groupId, studentIds: [studentId] });
  };

  const handleRemoveStudentFromGroup = (groupId: number, userId: number) => {
    removeMemberMutation.mutate({ groupId, userId });
  };

  const progress = useMemo(() => {
    const totalStudents = allStudents.length;
    const assignedStudents = groups?.reduce((sum, group) => sum + group.members.length, 0) || 0;
    return totalStudents > 0 ? (assignedStudents / totalStudents) * 100 : 0;
  }, [allStudents, groups]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des groupes</h1>
          <p className="text-muted-foreground">Organisez les étudiants en groupes pour ce projet</p>
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
            {project.promotions.length > 1 && (
              <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                {project.promotions.map((promotion) => (
                  <TabsTrigger key={promotion.id} value={promotion.id.toString()} className="min-w-max">
                    {promotion.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            {project.promotions.map((promotion) => (
              <TabsContent key={promotion.id} value={promotion.id.toString()} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{promotion.name}</h3>
                      <p className="text-muted-foreground">{promotion.description}</p>
                    </div>
                  </div>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progression</span>
                          <span className="text-sm text-muted-foreground">
                            {allStudents.length - unassignedStudents.length}/{allStudents.length}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{unassignedStudents.length} étudiants</div>
                            <div className="text-muted-foreground">Non assignés</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle className="text-lg">Paramètres des groupes</CardTitle>
                      </div>
                      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
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
                                <Button type="button" variant="outline" onClick={() => setShowSettingsDialog(false)}>
                                  Annuler
                                </Button>
                                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                  {updateSettingsMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  )}
                                  Enregistrer
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {groupSettings ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold">{getGroupModeText(groupSettings.mode)}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {groupSettings.minMembers} à {groupSettings.maxMembers} étudiants
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(new Date(groupSettings.deadline), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Aucun paramètre de groupe défini pour cette promotion.
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={() => setShowSettingsDialog(true)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Définir les paramètres
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Groupes d'étudiants ({groups?.length || 0})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Dialog open={showCreateGroupsDialog} onOpenChange={setShowCreateGroupsDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer des groupes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
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
                              <Button type="button" variant="outline" onClick={() => setShowCreateGroupsDialog(false)}>
                                Annuler
                              </Button>
                              <Button type="submit" disabled={createGroupsMutation.isPending}>
                                {createGroupsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Créer
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {groups && groups.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groups.map((group) => (
                        <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="bg-muted/50 py-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{group.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge>{group.members.length} étudiants</Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setEditingGroup({ id: group.id, name: group.name })}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setGroupToDelete(group.id)}
                                      className="text-destructive"
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3">
                            <ul className="space-y-2">
                              {group.members.map((member) => (
                                <li
                                  key={member.id}
                                  className="flex justify-between items-center p-2 bg-muted/30 rounded-md"
                                >
                                  <span className="text-sm font-medium">
                                    {member.firstname} {member.lastname}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveStudentFromGroup(group.id, member.id)}
                                    disabled={removeMemberMutation.isPending}
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </li>
                              ))}
                            </ul>

                            {unassignedStudents.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Ajouter un étudiant :</p>
                                <Select onValueChange={(value) => handleAddStudentToGroup(group.id, Number(value))}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unassignedStudents.map((student) => (
                                      <SelectItem key={student.id} value={student.id.toString()}>
                                        {student.firstname} {student.lastname}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {unassignedStudents.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center text-amber-800 dark:text-amber-200">
                            <UserPlus className="h-5 w-5 mr-2" />
                            Étudiants non assignés ({unassignedStudents.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {unassignedStudents.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-2 border rounded-md bg-background"
                              >
                                <span className="text-sm">
                                  {student.firstname} {student.lastname}
                                </span>
                                <Select onValueChange={(value) => handleAddStudentToGroup(Number(value), student.id)}>
                                  <SelectTrigger className="w-32 h-7 text-xs">
                                    <SelectValue placeholder="Ajouter à..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {groups?.map((group) => (
                                      <SelectItem key={group.id} value={group.id.toString()}>
                                        {group.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun groupe créé</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Commencez par créer des groupes pour organiser vos étudiants.
                      </p>
                      <Button onClick={() => setShowCreateGroupsDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer des groupes
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={editingGroup !== null} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent className="sm:max-w-md">
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
                <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={updateGroupMutation.isPending}>
                  {updateGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={groupToDelete !== null} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleteGroupMutation.isPending}>
              {deleteGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
