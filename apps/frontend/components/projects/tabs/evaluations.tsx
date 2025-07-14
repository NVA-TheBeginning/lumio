"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Filter, GraduationCap, Save, Search, Settings, Trophy, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createGrade,
  Grade,
  getCriteria,
  getGradesForCriteria,
  ProjectType,
  updateGrade,
} from "@/app/dashboard/teachers/projects/actions";
import { CriteriaManagement } from "@/components/projects/criteria-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { isValidNumber } from "@/lib/utils";

interface ProjectEvaluationsProps {
  project: ProjectType;
}

export function ProjectEvaluations({ project }: ProjectEvaluationsProps) {
  const queryClient = useQueryClient();
  const [activePromotion, setActivePromotion] = useState<string>(project.promotions[0]?.id.toString() ?? "");
  const [grades, setGrades] = useState<Record<string, { value: number; comment?: string }>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [viewAllGrades, setViewAllGrades] = useState(false);
  const [gradesDisplayMode, setGradesDisplayMode] = useState<"criteria" | "group">("criteria");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCriteriaManagement, setShowCriteriaManagement] = useState(false);

  const { data: criteria = [], isLoading: criteriaLoading } = useQuery({
    queryKey: ["criteria", project.id, activePromotion],
    queryFn: () => getCriteria(project.id, Number(activePromotion)),
    enabled: !!activePromotion,
  });

  const { data: existingGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["grades", criteria.map((c) => c.id)],
    queryFn: async () => {
      const allGrades = await Promise.all(criteria.map((c) => getGradesForCriteria(c.id)));
      return allGrades.flat();
    },
    enabled: criteria.length > 0,
  });

  const updateGradeMutation = useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: number; data: { gradeValue?: number; comment?: string } }) =>
      updateGrade(gradeId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Note mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const createGradeMutation = useMutation({
    mutationFn: ({
      criteriaId,
      data,
    }: {
      criteriaId: number;
      data: { groupId: number; gradeValue: number; comment?: string };
    }) => createGrade(criteriaId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Note créée");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const activePromotion_obj = project.promotions.find((p) => p.id.toString() === activePromotion);
  const allGroups = activePromotion_obj?.groups ?? [];

  // Filter groups based on selection and search
  const filteredGroups = useMemo(() => {
    let filtered = allGroups;

    // Filter by selected group
    if (selectedGroup !== "all") {
      filtered = filtered.filter((group) => group.id.toString() === selectedGroup);
    }

    // Filter by search term (search in group name and member names)
    if (searchTerm) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.members.some((member) =>
            `${member.firstname} ${member.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    return filtered;
  }, [allGroups, selectedGroup, searchTerm]);

  const gradeMatrix = useMemo(() => {
    const matrix: Record<string, Grade | undefined> = {};
    existingGrades.forEach((grade) => {
      const key = `${grade.gradingCriteriaId}-${grade.groupId}`;
      matrix[key] = grade;
    });
    return matrix;
  }, [existingGrades]);

  const handleGradeChange = (criteriaId: number, groupId: number, value: string | number[]) => {
    const key = `${criteriaId}-${groupId}`;
    const numValue = typeof value === "string" ? parseFloat(value) : (value[0] ?? 0);

    if (Number.isNaN(numValue) || numValue < 0 || numValue > 20) return;

    setGrades((prev) => ({
      ...prev,
      [key]: { value: numValue, comment: prev[key]?.comment ?? "" },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const handleIndividualGradeChange = (criteriaId: number, groupId: number, studentId: number, value: number[]) => {
    const key = `${criteriaId}-${groupId}-${studentId}`;
    const numValue = value[0] ?? 0;

    if (Number.isNaN(numValue) || numValue < 0 || numValue > 20) return;

    setGrades((prev) => ({
      ...prev,
      [key]: { value: numValue, comment: prev[key]?.comment ?? "" },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const handleCommentChange = (criteriaId: number, groupId: number, comment: string, studentId?: number) => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    setGrades((prev) => ({
      ...prev,
      [key]: { value: prev[key]?.value ?? 0, comment },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const saveGrade = (criteriaId: number, groupId: number, studentId?: number) => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    const gradeData = grades[key];
    const existingGrade = gradeMatrix[key];

    if (!gradeData) return;

    if (existingGrade) {
      updateGradeMutation.mutate({
        gradeId: existingGrade.id,
        data: { gradeValue: gradeData.value, comment: gradeData.comment },
      });
    } else {
      createGradeMutation.mutate({
        criteriaId,
        data: { groupId, gradeValue: gradeData.value, comment: gradeData.comment },
      });
    }

    setPendingUpdates((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const getGradeValue = (criteriaId: number, groupId: number, studentId?: number): number => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    return grades[key]?.value ?? gradeMatrix[key]?.gradeValue ?? 0;
  };

  const getGradeComment = (criteriaId: number, groupId: number, studentId?: number): string => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    return grades[key]?.comment ?? gradeMatrix[key]?.comment ?? "";
  };

  const isPending = (criteriaId: number, groupId: number, studentId?: number): boolean => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    return pendingUpdates.has(key);
  };

  if (criteriaLoading || gradesLoading) {
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
          <h1 className="text-2xl font-bold">Évaluations</h1>
          <p className="text-muted-foreground">Notez les groupes selon les critères définis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCriteriaManagement(!showCriteriaManagement)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Settings className="h-4 w-4" />
            Gérer les critères
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewAllGrades(!viewAllGrades)}
            className="flex items-center gap-2 shadow-sm"
          >
            {viewAllGrades ? (
              <>
                <EyeOff className="h-4 w-4" />
                Masquer les notes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Voir toutes les notes
              </>
            )}
          </Button>
        </div>
      </div>

      {showCriteriaManagement && <CriteriaManagement projectId={project.id} promotionId={Number(activePromotion)} />}

      {viewAllGrades && (
        <Card className="shadow-lg border-2 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Toutes les notes</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={gradesDisplayMode === "criteria" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGradesDisplayMode("criteria")}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Par critères
                </Button>
                <Button
                  variant={gradesDisplayMode === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGradesDisplayMode("group")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Par groupes
                </Button>
              </div>
            </div>

            {gradesDisplayMode === "criteria" ? (
              <div className="space-y-6">
                {criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-3 bg-blue-500 rounded-full" />
                      <h4 className="text-lg font-bold text-gray-800">{criterion.name}</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {criterion.weight}%
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          criterion.individual ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {criterion.individual ? "Individuel" : "Groupe"}
                      </span>
                    </div>

                    {criterion.individual ? (
                      <div className="space-y-4">
                        {allGroups.map((group) => (
                          <div key={group.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-800">{group.name}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.members.map((member) => {
                                const gradeValue = getGradeValue(criterion.id, group.id, member.id);
                                const gradeComment = getGradeComment(criterion.id, group.id, member.id);
                                return (
                                  <div
                                    key={member.id}
                                    className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="h-3 w-3 text-purple-600" />
                                      <span className="font-medium text-sm text-gray-800">
                                        {member.firstname} {member.lastname}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-purple-700">{gradeValue}</span>
                                      <span className="text-sm text-gray-500">/20</span>
                                    </div>
                                    {gradeComment && (
                                      <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                                        {gradeComment}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allGroups.map((group) => {
                          const gradeValue = getGradeValue(criterion.id, group.id);
                          const gradeComment = getGradeComment(criterion.id, group.id);
                          return (
                            <div
                              key={group.id}
                              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-gray-800">{group.name}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-3xl font-bold text-green-700">{gradeValue}</span>
                                <span className="text-sm text-gray-500">/20</span>
                              </div>
                              {gradeComment && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                  {gradeComment}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {allGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-3 bg-green-500 rounded-full" />
                      <h4 className="text-lg font-bold text-gray-800">{group.name}</h4>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {group.members.length} membre{group.members.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {criteria.map((criterion) => (
                        <div key={criterion.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                criterion.individual ? "bg-purple-500" : "bg-blue-500"
                              }`}
                            />
                            <span className="font-medium text-gray-800">{criterion.name}</span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                criterion.individual ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {criterion.individual ? "Individuel" : "Groupe"}
                            </span>
                          </div>

                          {criterion.individual ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {group.members.map((member) => {
                                const gradeValue = getGradeValue(criterion.id, group.id, member.id);
                                const gradeComment = getGradeComment(criterion.id, group.id, member.id);
                                return (
                                  <div key={member.id} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-1 mb-1">
                                      <User className="h-3 w-3 text-purple-600" />
                                      <span className="text-xs font-medium text-gray-700">
                                        {member.firstname} {member.lastname}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-lg font-bold text-purple-700">{gradeValue}</span>
                                      <span className="text-xs text-gray-500">/20</span>
                                    </div>
                                    {gradeComment && (
                                      <div className="mt-1 text-xs text-gray-600 truncate" title={gradeComment}>
                                        {gradeComment}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 inline-block">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-blue-700">
                                  {getGradeValue(criterion.id, group.id)}
                                </span>
                                <span className="text-sm text-gray-500">/20</span>
                              </div>
                              {getGradeComment(criterion.id, group.id) && (
                                <div className="mt-1 text-xs text-gray-600">
                                  {getGradeComment(criterion.id, group.id)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Grille de notation - {promotion.name}</h3>
                  </div>

                  {/* Main Layout with Sidebar */}
                  <div className="flex gap-6 min-h-[600px]">
                    {/* Left Sidebar */}
                    <div className="w-80 flex-shrink-0">
                      <Card className="h-full shadow-lg border-2 border-gray-100">
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            {/* Search Bar */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Search className="h-5 w-5 text-blue-600" />
                                <label htmlFor="group-search" className="text-lg font-bold text-gray-800">
                                  Recherche
                                </label>
                              </div>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  id="group-search"
                                  placeholder="Rechercher un groupe ou membre..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10 border-2 border-gray-200 focus:border-blue-400 transition-colors"
                                />
                              </div>
                            </div>

                            {/* Group List */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="h-5 w-5 text-green-600" />
                                <h4 className="text-lg font-bold text-gray-800">Groupes</h4>
                                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                                  {filteredGroups.length}
                                </span>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => setSelectedGroup("all")}
                                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border-2 ${
                                    selectedGroup === "all"
                                      ? "bg-blue-50 text-blue-900 border-blue-300 shadow-md"
                                      : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold">Tous les groupes</span>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {allGroups.length} groupe{allGroups.length > 1 ? "s" : ""} au total
                                  </div>
                                </button>
                                {filteredGroups.map((group) => (
                                  <button
                                    type="button"
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group.id.toString())}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border-2 ${
                                      selectedGroup === group.id.toString()
                                        ? "bg-green-50 text-green-900 border-green-300 shadow-md"
                                        : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                                      <span className="font-semibold">{group.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {group.members.length} membre{group.members.length > 1 ? "s" : ""}
                                    </div>
                                    {group.members.length > 0 && (
                                      <div
                                        className="text-xs text-gray-500 mt-1 truncate"
                                        title={group.members.map((m) => `${m.firstname} ${m.lastname}`).join(", ")}
                                      >
                                        {group.members.map((m) => `${m.firstname} ${m.lastname}`).join(", ")}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                      <Card className="h-full shadow-lg border-2 border-gray-100">
                        <CardContent className="p-6">
                          {criteria.length === 0 ? (
                            <div className="text-center py-12">
                              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                              <h3 className="mt-4 text-lg font-medium">Aucun critère défini</h3>
                              <p className="mt-2 text-muted-foreground">
                                Les critères d'évaluation doivent être définis avant de pouvoir noter les groupes.
                              </p>
                            </div>
                          ) : allGroups.length === 0 ? (
                            <div className="text-center py-12">
                              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                              <h3 className="mt-4 text-lg font-medium">Aucun groupe créé</h3>
                              <p className="mt-2 text-muted-foreground">
                                Créez des groupes dans l'onglet "Groupes" pour pouvoir les évaluer.
                              </p>
                            </div>
                          ) : filteredGroups.length === 0 ? (
                            <div className="text-center py-12">
                              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                              <h3 className="mt-4 text-lg font-medium">Aucun groupe trouvé</h3>
                              <p className="mt-2 text-muted-foreground">
                                Aucun groupe ne correspond à votre recherche. Essayez un autre terme.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Critères headers */}
                              <div className="grid grid-cols-1 gap-4 mb-4">
                                <div className="flex gap-2 text-sm font-medium">
                                  <div className="w-40">Groupe</div>
                                  {criteria.map((criterion) => (
                                    <div key={criterion.id} className="flex-1 text-center">
                                      {criterion.name}
                                      <div className="text-xs text-muted-foreground">
                                        ({criterion.weight}% - {criterion.type})
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Grading grid */}
                              <div className="space-y-4">
                                {filteredGroups.map((group) => (
                                  <Card
                                    key={group.id}
                                    className="p-6 shadow-md border-2 border-gray-100 hover:shadow-lg transition-shadow"
                                  >
                                    <div className="flex gap-2 items-start">
                                      <div className="w-48 pt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="h-3 w-3 bg-blue-500 rounded-full" />
                                          <span className="font-bold text-gray-800">{group.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Users className="h-3 w-3" />
                                          <span>
                                            {group.members.length} membre{group.members.length > 1 ? "s" : ""}
                                          </span>
                                        </div>
                                      </div>

                                      {criteria.map((criterion) => (
                                        <div key={criterion.id} className="flex-1 space-y-3">
                                          {criterion.individual ? (
                                            <div className="space-y-3">
                                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-3">
                                                <div className="flex items-center gap-2 justify-center">
                                                  <User className="h-4 w-4 text-purple-600" />
                                                  <span className="text-sm font-bold text-gray-800">
                                                    {criterion.name}
                                                  </span>
                                                </div>
                                                <div className="text-xs text-purple-700 text-center mt-1">
                                                  Évaluation individuelle
                                                </div>
                                              </div>
                                              {group.members.map((member) => (
                                                <div
                                                  key={member.id}
                                                  className="bg-white border-2 border-purple-100 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                                                >
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <User className="h-3 w-3 text-purple-600" />
                                                    <span className="text-sm font-bold text-gray-800">
                                                      {member.firstname} {member.lastname}
                                                    </span>
                                                  </div>
                                                  <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                      <span className="text-lg font-bold text-purple-700 w-8">
                                                        {getGradeValue(criterion.id, group.id, member.id)}
                                                      </span>
                                                      <Slider
                                                        value={[getGradeValue(criterion.id, group.id, member.id)]}
                                                        onValueChange={(value) =>
                                                          handleIndividualGradeChange(
                                                            criterion.id,
                                                            group.id,
                                                            member.id,
                                                            value,
                                                          )
                                                        }
                                                        max={20}
                                                        min={0}
                                                        step={0.5}
                                                        className="flex-1"
                                                      />
                                                      <span className="text-sm text-gray-500 font-medium">/20</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                      <Textarea
                                                        placeholder="Commentaire..."
                                                        value={getGradeComment(criterion.id, group.id, member.id)}
                                                        onChange={(e) =>
                                                          handleCommentChange(
                                                            criterion.id,
                                                            group.id,
                                                            e.target.value,
                                                            member.id,
                                                          )
                                                        }
                                                        className="min-h-[50px] text-xs flex-1"
                                                      />
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => saveGrade(criterion.id, group.id, member.id)}
                                                        disabled={!isPending(criterion.id, group.id, member.id)}
                                                      >
                                                        <Save className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-3">
                                                <div className="flex items-center gap-2 justify-center">
                                                  <Users className="h-4 w-4 text-green-600" />
                                                  <span className="text-sm font-bold text-gray-800">
                                                    {criterion.name}
                                                  </span>
                                                </div>
                                                <div className="text-xs text-green-700 text-center mt-1">
                                                  Évaluation de groupe
                                                </div>
                                              </div>
                                              <div className="bg-white border-2 border-green-100 rounded-lg p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                  <span className="text-lg font-bold text-green-700 w-10">
                                                    {getGradeValue(criterion.id, group.id)}
                                                  </span>
                                                  <Slider
                                                    value={[getGradeValue(criterion.id, group.id)]}
                                                    onValueChange={(value) =>
                                                      handleGradeChange(criterion.id, group.id, value)
                                                    }
                                                    max={20}
                                                    min={0}
                                                    step={0.5}
                                                    className="flex-1"
                                                  />
                                                  <span className="text-sm text-gray-500 font-medium">/20</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <Textarea
                                                    placeholder="Commentaire..."
                                                    value={getGradeComment(criterion.id, group.id)}
                                                    onChange={(e) =>
                                                      handleCommentChange(criterion.id, group.id, e.target.value)
                                                    }
                                                    className="min-h-[60px] text-xs flex-1"
                                                  />
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => saveGrade(criterion.id, group.id)}
                                                    disabled={!isPending(criterion.id, group.id)}
                                                  >
                                                    <Save className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
