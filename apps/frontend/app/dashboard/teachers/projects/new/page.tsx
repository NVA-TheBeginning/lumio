"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { getPromotions } from "@/app/dashboard/teachers/promotions/action";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { createProject } from "../actions";

const groupSettingSchema = z.object({
  promotionId: z.number().positive(),
  minMembers: z.number().min(1, "Minimum 1 membre requis"),
  maxMembers: z.number().min(1, "Minimum 1 membre requis"),
  mode: z.string().refine((val) => ["RANDOM", "FREE", "MANUAL"].includes(val), {
    message: "Mode invalide",
  }),
  deadline: z.string().min(1, "La date limite est requise"),
});

const createProjectSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  creatorId: z.number().positive("L'ID du créateur est requis"),
  hasReport: z.boolean().optional(),
  promotionIds: z.array(z.number()),
  groupSettings: z.array(groupSettingSchema).optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function CreateProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: promotions = [],
    isLoading: isLoadingPromotions,
    error: promotionsError,
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });

  const defaultValues: Partial<CreateProjectFormValues> = {
    name: "",
    description: "",
    creatorId: 1, // Will be replaced during request
    hasReport: true,
    promotionIds: [],
    groupSettings: [],
  };

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues,
    mode: "onChange",
  });

  const { watch, setValue, getValues } = form;
  const groupSettings = watch("groupSettings") ?? [];

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectFormValues) => createProject(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard/teachers/projects");
    },
    onError: (error: Error) => {
      console.error("Error creating project:", error);
    },
  });

  const watchPromotionIds = watch("promotionIds");

  useEffect(() => {
    const currentPromotionIds = watchPromotionIds;
    const currentGroupSettings = getValues("groupSettings") ?? [];
    const existingSettingsMap = new Map(currentGroupSettings.map((setting) => [setting.promotionId, setting]));

    if (!currentPromotionIds || currentPromotionIds.length === 0) {
      setValue("groupSettings", [], { shouldDirty: true, shouldValidate: true });
      return;
    }

    const newGroupSettings = currentPromotionIds
      .map((promotionId) => {
        const existingSetting = existingSettingsMap.get(promotionId);
        if (existingSetting) {
          return existingSetting;
        }
        return {
          promotionId,
          minMembers: 1,
          maxMembers: 5,
          mode: "FREE",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      })
      .filter((setting) => currentPromotionIds.includes(setting.promotionId));

    setValue("groupSettings", newGroupSettings, { shouldDirty: true, shouldValidate: true });
  }, [getValues, setValue, watchPromotionIds]);

  const onSubmit = (data: CreateProjectFormValues): void => {
    createProjectMutation.mutate(data);
  };

  if (promotionsError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 border rounded-lg bg-red-50 text-red-800">
          <h2 className="text-2xl font-bold">Erreur</h2>
          <p className="mt-4">Impossible de charger les promotions. Veuillez réessayer plus tard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Créer un nouveau projet</h1>
        <p className="text-gray-500 mt-1">Définissez les détails de votre projet et les paramètres des groupes</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Entrez les informations de base de votre projet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du projet</FormLabel>
                    <FormControl>
                      <Input placeholder="Projet de développement web" {...field} />
                    </FormControl>
                    <FormDescription>Le nom qui sera affiché aux étudiants</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez le projet et ses objectifs..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Une description détaillée du projet et de ses objectifs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasReport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Activer les rapports</FormLabel>
                      <FormDescription>Les étudiants devront rédiger un rapport à la fin du projet</FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promotionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotions concernées (optionnel)</FormLabel>
                    {isLoadingPromotions ? (
                      <FormControl>
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner des promotions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loading" disabled>
                              <Skeleton className="h-10 w-full" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const selectedId = Number.parseInt(value);
                            const currentIds = field.value;
                            if (!currentIds.includes(selectedId)) {
                              field.onChange([...currentIds, selectedId]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner des promotions" />
                          </SelectTrigger>
                          <SelectContent>
                            {promotions.length > 0 ? (
                              promotions.map((promotion) => (
                                <SelectItem key={promotion.id} value={promotion.id.toString()}>
                                  {promotion.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-promotions" disabled>
                                Aucune promotion disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((promotionId) => {
                        const promotion = promotions.find((p) => p.id === promotionId);
                        return promotion ? (
                          <div
                            key={promotion.id}
                            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                          >
                            {promotion.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => {
                                field.onChange(
                                  (Array.isArray(field.value) ? field.value : []).filter((id) => id !== promotion.id),
                                );
                              }}
                            >
                              <Trash className="h-3 w-3" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <FormDescription>Les promotions qui auront accès à ce projet (facultatif)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {groupSettings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres des groupes</CardTitle>
                <CardDescription>Définissez comment les groupes seront formés pour chaque promotion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groupSettings.map((groupSetting, index) => (
                  <div key={groupSetting.promotionId} className="border rounded-lg p-4 space-y-4 relative">
                    <h3 className="text-lg font-semibold">
                      {promotions.find((p) => p.id === groupSetting.promotionId)?.name}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`groupSettings.${index}.minMembers`}
                        render={({ field }) => (
                          <FormItem className="min-h-[80px]">
                            <FormLabel>Nombre minimum de membres</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={form.getValues(`groupSettings.${index}.maxMembers`) || 10}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`groupSettings.${index}.maxMembers`}
                        render={({ field }) => (
                          <FormItem className="min-h-[80px]">
                            <FormLabel>Nombre maximum de membres</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={form.getValues(`groupSettings.${index}.minMembers`) || 1}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`groupSettings.${index}.mode`}
                      render={({ field }) => (
                        <FormItem className="min-h-[140px]">
                          <FormLabel>Mode de formation des groupes</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RANDOM">Automatique</SelectItem>
                              <SelectItem value="FREE">Libre</SelectItem>
                              <SelectItem value="MANUAL">Manuel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Automatique: les groupes sont formés par le système
                            <br />
                            Libre: les étudiants forment leurs groupes
                            <br />
                            Manuel: l&apos;enseignant forme les groupes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`groupSettings.${index}.deadline`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col min-h-[90px]">
                          <FormLabel>Date limite de formation des groupes</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-1/4 justify-start text-left font-normal ${
                                    !field.value && "text-muted-foreground"
                                  }`}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    <span>{formatDate(field.value)}</span>
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <CardFooter className="flex justify-between border rounded-lg p-4">
            <HoverPrefetchLink href="/dashboard/teachers/projects">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </HoverPrefetchLink>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending || isLoadingPromotions || form.formState.isSubmitting}
            >
              {createProjectMutation.isPending ? "Création en cours..." : "Créer le projet"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
