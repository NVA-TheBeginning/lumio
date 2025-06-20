/** biome-ignore-all lint/a11y/noStaticElementInteractions: Needed for drag-and-drop functionality */
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import {
  AlertCircle,
  Badge,
  Clock,
  Edit,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Plus,
  Settings,
  Shuffle,
  Trash,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  addMembersToGroup,
  type CreateGroupsDto,
  createGroups,
  deleteGroup,
  type GroupSettingsUpdateDto,
  getPromoStudent,
  type ProjectType,
  randomizeStudentsToGroups,
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface DraggedStudent {
  id: number;
  firstname: string;
  lastname: string;
}

interface DropZoneProps {
  groupId: number;
  children: React.ReactNode;
  onDrop: (studentId: number, groupId: number) => void;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ groupId, children, onDrop, className = "" }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropElement = dropRef.current;
    if (!dropElement) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!dropElement.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const studentData = e.dataTransfer?.getData("application/json");
        if (studentData) {
          const student: DraggedStudent = JSON.parse(studentData);
          onDrop(student.id, groupId);
        }
      } catch (error) {
        console.error("Error parsing dropped data:", error);
      }
    };

    dropElement.addEventListener("dragover", handleDragOver);
    dropElement.addEventListener("dragleave", handleDragLeave);
    dropElement.addEventListener("drop", handleDrop);

    return () => {
      dropElement.removeEventListener("dragover", handleDragOver);
      dropElement.removeEventListener("dragleave", handleDragLeave);
      dropElement.removeEventListener("drop", handleDrop);
    };
  }, [groupId, onDrop]);

  return (
    <div
      ref={dropRef}
      className={`${className} transition-all duration-200 ${
        isDragOver ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-950/50" : ""
      }`}
    >
      {children}
    </div>
  );
};

interface DraggableStudentProps {
  student: Member;
  onRemove?: () => void;
  showRemove?: boolean;
  isInGroup?: boolean;
}

const DraggableStudent: React.FC<DraggableStudentProps> = ({
  student,
  onRemove,
  showRemove = false,
  isInGroup = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    const studentData: DraggedStudent = {
      id: student.id,
      firstname: student.firstname,
      lastname: student.lastname,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(studentData));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex justify-between items-center p-2 rounded-md cursor-move transition-all duration-200 ${
        isInGroup ? "bg-muted/30 hover:bg-muted/50" : "bg-background border hover:bg-muted/20"
      } ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
    >
      <div className="flex items-center space-x-2">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-medium">
          {student.firstname} {student.lastname}
        </span>
      </div>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

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
  const [showRandomizeConfirm, setShowRandomizeConfirm] = useState<boolean>(false);

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
      toast.success("Étudiant ajouté au groupe");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) => removeMemberFromGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      toast.success("Étudiant retiré du groupe");
    },
  });

  const randomizeStudentsMutation = useMutation({
    mutationFn: () => randomizeStudentsToGroups(project.id, activePromotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", Number(project.id)],
      });
      toast.success("Les étudiants ont été répartis aléatoirement dans les groupes");
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
    const previousMode = groupSettings?.mode;
    updateSettingsMutation.mutate(data);

    if (
      data.mode === "RANDOM" &&
      previousMode !== "RANDOM" &&
      unassignedStudents.length > 0 &&
      groups &&
      groups.length > 0
    ) {
      setTimeout(() => {
        toast.info("Répartition aléatoire en cours...");
        randomizeStudentsMutation.mutate();
      }, 1000);
    }
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

  const handleStudentDrop = (studentId: number, groupId: number) => {
    addMemberMutation.mutate({ groupId, studentIds: [studentId] });
  };

  const handleRemoveStudentFromGroup = (groupId: number, userId: number) => {
    removeMemberMutation.mutate({ groupId, userId });
  };

  const handleRandomizeStudents = () => {
    setShowRandomizeConfirm(true);
  };

  const handleConfirmRandomize = () => {
    randomizeStudentsMutation.mutate();
    setShowRandomizeConfirm(false);
  };

  const progress = useMemo(() => {
    const totalStudents = allStudents.length;
    const assignedStudents = groups?.reduce((sum, group) => sum + group.members.length, 0) || 0;
    return totalStudents > 0 ? (assignedStudents / totalStudents) * 100 : 0;
  }, [allStudents, groups]);

  const canDragAndDrop = groupSettings?.mode !== "RANDOM";

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
                    {groupSettings?.mode === "RANDOM" &&
                      unassignedStudents.length > 0 &&
                      groups &&
                      groups.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleRandomizeStudents}
                          disabled={randomizeStudentsMutation.isPending}
                        >
                          {randomizeStudentsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Shuffle className="h-4 w-4 mr-2" />
                          )}
                          Répartir aléatoirement
                        </Button>
                      )}
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
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {unassignedStudents.length > 0 && (
                      <div className="xl:col-span-1 order-2 xl:order-1">
                        <Card className="sticky top-4 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
                          <CardHeader className="pb-3">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              Glissez les étudiants vers les groupes pour les assigner
                            </p>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <ScrollArea className="h-[500px] pr-3">
                              <div className="space-y-2">
                                {unassignedStudents.map((student) => (
                                  <DraggableStudent key={student.id} student={student} isInGroup={false} />
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div
                      className={`${unassignedStudents.length > 0 ? "xl:col-span-3" : "xl:col-span-4"} order-1 xl:order-2`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                          <DropZone key={group.id} groupId={group.id} onDrop={handleStudentDrop} className="h-full">
                            <Card className="overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col">
                              <CardHeader className="bg-muted/50 py-3 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-base">{group.name}</CardTitle>
                                  <div className="flex items-center space-x-2">
                                    {group.members.length === groupSettings?.maxMembers && (
                                      <div className="text-xs">Complet</div>
                                    )}
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
                              <CardContent className="py-3 flex-grow flex flex-col">
                                {group.members.length > 0 ? (
                                  <ScrollArea className="flex-grow">
                                    <div className="space-y-2 pr-3">
                                      {group.members.map((member) => (
                                        <DraggableStudent
                                          key={member.id}
                                          student={member as unknown as Member}
                                          showRemove={canDragAndDrop}
                                          onRemove={() => handleRemoveStudentFromGroup(group.id, member.id)}
                                          isInGroup={true}
                                        />
                                      ))}
                                    </div>
                                  </ScrollArea>
                                ) : (
                                  <div className="flex-grow flex items-center justify-center text-center py-8">
                                    <div className="text-muted-foreground">
                                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">Aucun étudiant</p>
                                      {canDragAndDrop && <p className="text-xs mt-1">Glissez des étudiants ici</p>}
                                    </div>
                                  </div>
                                )}

                                {unassignedStudents.length > 0 &&
                                  groupSettings?.mode !== "RANDOM" &&
                                  !canDragAndDrop && (
                                    <div className="mt-3 pt-3 border-t flex-shrink-0">
                                      <p className="text-xs text-muted-foreground mb-2">Ajouter un étudiant :</p>
                                      <Select onValueChange={(value) => handleStudentDrop(Number(value), group.id)}>
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
                          </DropZone>
                        ))}
                      </div>
                    </div>
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

      <Dialog open={showRandomizeConfirm} onOpenChange={setShowRandomizeConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la répartition aléatoire</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir répartir aléatoirement les {unassignedStudents.length} étudiants non assignés
              dans les groupes existants ? Cette action peut modifier la composition actuelle des groupes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRandomizeConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmRandomize} disabled={randomizeStudentsMutation.isPending}>
              {randomizeStudentsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer la répartition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
