"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  MessageSquare,
  MinusCircle,
  Search,
  Settings,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createGrade,
  Grade,
  GradingCriteria,
  getCriteria,
  getGradesForCriteria,
  ProjectType,
  updateGrade,
} from "@/app/dashboard/teachers/projects/actions";
import { CriteriaManagement } from "@/components/projects/criteria-management";
import { Badge } from "@/components/ui/badge";
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

interface GroupMember {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  addedAt: string;
}

interface ProjectGroup {
  id: number;
  name: string;
  members: GroupMember[];
}

function getGroupProgress(
  groupId: number,
  criteria: GradingCriteria[],
  grades: Record<string, { gradeValue: number; comment?: string }>,
  group: ProjectGroup,
) {
  let groupTotal = 0;
  let groupGraded = 0;
  let indivTotal = 0;
  let indivGraded = 0;
  for (const criterion of criteria) {
    if (criterion.individual) {
      indivTotal += group.members.length;
      for (const member of group.members) {
        const key = `${criterion.id}-${groupId}-${member.id}`;
        if (grades[key]?.gradeValue !== undefined) {
          indivGraded++;
        }
      }
    } else {
      groupTotal++;
      const key = `${criterion.id}-${groupId}`;
      if (grades[key]?.gradeValue !== undefined) {
        groupGraded++;
      }
    }
  }
  return { groupGraded, groupTotal, indivGraded, indivTotal };
}

function getGroupStatusSimple(groupGraded: number, groupTotal: number, indivGraded: number, indivTotal: number) {
  const all = groupGraded === groupTotal && indivGraded === indivTotal && groupTotal + indivTotal > 0;
  const none = groupGraded === 0 && indivGraded === 0;
  if (all) return "all";
  if (none) return "none";
  return "partial";
}

export function ProjectEvaluations({ project }: ProjectEvaluationsProps) {
  const queryClient = useQueryClient();
  const [activePromotion, setActivePromotion] = useState<string>(project.promotions[0]?.id.toString() ?? "");
  const [grades, setGrades] = useState<Record<string, { gradeValue: number; comment?: string }>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [viewAllGrades, setViewAllGrades] = useState(false);
  const [gradesDisplayMode, setGradesDisplayMode] = useState<"criteria" | "group">("criteria");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCriteriaManagement, setShowCriteriaManagement] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const [showComments, setShowComments] = useState<Set<string>>(new Set());

  const toggleComment = (key: string) => {
    setShowComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const { data: criteria = [], isLoading: criteriaLoading } = useQuery<GradingCriteria[]>({
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

  const filteredGroups = useMemo(() => {
    let filtered = allGroups;

    if (selectedGroup !== "all") {
      filtered = filtered.filter((group) => group.id.toString() === selectedGroup);
    }

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
      [key]: { gradeValue: numValue, comment: prev[key]?.comment ?? "" },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const handleIndividualGradeChange = (criteriaId: number, groupId: number, studentId: number, value: number[]) => {
    const key = `${criteriaId}-${groupId}-${studentId}`;
    const numValue = value[0] ?? 0;

    if (Number.isNaN(numValue) || numValue < 0 || numValue > 20) return;

    setGrades((prev) => ({
      ...prev,
      [key]: { gradeValue: numValue, comment: prev[key]?.comment ?? "" },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const handleCommentChange = (criteriaId: number, groupId: number, comment: string, studentId?: number) => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    setGrades((prev) => ({
      ...prev,
      [key]: { gradeValue: prev[key]?.gradeValue ?? 0, comment },
    }));

    setPendingUpdates((prev) => new Set(prev).add(key));
  };

  const getGradeValue = (criteriaId: number, groupId: number, studentId?: number): number => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    return grades[key]?.gradeValue ?? gradeMatrix[key]?.gradeValue ?? 0;
  };

  const getGradeComment = (criteriaId: number, groupId: number, studentId?: number): string => {
    const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
    return grades[key]?.comment ?? gradeMatrix[key]?.comment ?? "";
  };

  const saveGrade = useCallback(
    (criteriaId: number, groupId: number, studentId?: number) => {
      const key = isValidNumber(studentId) ? `${criteriaId}-${groupId}-${studentId}` : `${criteriaId}-${groupId}`;
      const gradeData = grades[key];
      const existingGrade = gradeMatrix[key];

      if (!gradeData) return;

      if (existingGrade) {
        updateGradeMutation.mutate({
          gradeId: existingGrade.id,
          data: { gradeValue: gradeData.gradeValue, comment: gradeData.comment },
        });
      } else {
        createGradeMutation.mutate({
          criteriaId,
          data: { groupId, gradeValue: gradeData.gradeValue, comment: gradeData.comment },
        });
      }

      setPendingUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    },
    [grades, gradeMatrix, updateGradeMutation, createGradeMutation],
  );

  useEffect(() => {
    if (pendingUpdates.size === 0) return;

    const timeout = setTimeout(() => {
      const pendingKeys = Array.from(pendingUpdates);

      for (const key of pendingKeys) {
        const parts = key.split("-").map(Number);
        const criteriaId = parts[0];
        const groupId = parts[1];
        const studentId = parts[2];

        if (!(criteriaId && groupId)) continue;

        if (parts.length === 3 && isValidNumber(studentId)) {
          saveGrade(criteriaId, groupId, studentId);
        } else if (parts.length === 2) {
          saveGrade(criteriaId, groupId);
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [pendingUpdates.size, saveGrade, pendingUpdates]);

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
            onClick={() => {
              setShowCriteriaManagement(!showCriteriaManagement);
            }}
            className="flex items-center gap-2 shadow-sm"
          >
            <Settings className="h-4 w-4" />
            Gérer les critères
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setViewAllGrades(!viewAllGrades);
            }}
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
                  onClick={() => {
                    setGradesDisplayMode("criteria");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Par critères
                </Button>
                <Button
                  variant={gradesDisplayMode === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setGradesDisplayMode("group");
                  }}
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
              <div className="w-full overflow-x-auto">
                <div className="divide-y">
                  {filteredGroups.map((group) => {
                    const { groupGraded, groupTotal, indivGraded, indivTotal } = getGroupProgress(
                      group.id,
                      criteria,
                      grades,
                      group,
                    );
                    const status = getGroupStatusSimple(groupGraded, groupTotal, indivGraded, indivTotal);
                    return (
                      <button
                        type="button"
                        key={group.id}
                        className="flex items-center gap-6 py-3 px-4 hover:bg-muted cursor-pointer transition-colors group w-full text-left"
                        title={`Voir les évaluations du ${group.name}`}
                        onClick={() => {
                          toggleGroup(group.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleGroup(group.id);
                          }
                        }}
                      >
                        <span className="font-bold w-40 flex items-center gap-2">
                          {status === "all" && <CheckCircle className="text-green-500 w-4 h-4" />}
                          {status === "partial" && <Circle className="text-yellow-500 w-4 h-4" />}
                          {status === "none" && <MinusCircle className="text-gray-400 w-4 h-4" />}
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold">Group:</span> {groupGraded}/{groupTotal}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold">Indiv:</span> {indivGraded}/{indivTotal}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                                  onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                  }}
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
                                  onClick={() => {
                                    setSelectedGroup("all");
                                  }}
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
                                    onClick={() => {
                                      setSelectedGroup(group.id.toString());
                                    }}
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
                              {/* Compact Progress View */}
                              {filteredGroups.map((group) => {
                                const { groupGraded, groupTotal, indivGraded, indivTotal } = getGroupProgress(
                                  group.id,
                                  criteria,
                                  grades,
                                  group,
                                );
                                const status = getGroupStatusSimple(groupGraded, groupTotal, indivGraded, indivTotal);
                                const isExpanded = expandedGroups.has(group.id);
                                const progressPercentage =
                                  ((groupGraded + indivGraded) / Math.max(1, groupTotal + indivTotal)) * 100;

                                return (
                                  <div key={group.id} className="border rounded-lg overflow-hidden">
                                    {/* Group Overview Row */}
                                    <button
                                      type="button"
                                      className={`p-4 cursor-pointer transition-all duration-200 w-full text-left ${
                                        status === "all"
                                          ? "bg-green-50 hover:bg-green-100 border-green-200"
                                          : status === "partial"
                                            ? "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                                            : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                                      } ${isExpanded ? "border-b" : ""}`}
                                      onClick={() => {
                                        toggleGroup(group.id);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          toggleGroup(group.id);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          {status === "all" && <CheckCircle className="text-green-500 w-5 h-5" />}
                                          {status === "partial" && <Circle className="text-yellow-500 w-5 h-5" />}
                                          {status === "none" && <MinusCircle className="text-gray-400 w-5 h-5" />}
                                          <h4 className="font-semibold text-lg">{group.name}</h4>
                                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Users className="w-4 h-4" />
                                              <span className="font-medium">Groupe:</span> {groupGraded}/{groupTotal}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <User className="w-4 h-4" />
                                              <span className="font-medium">Individuel:</span> {indivGraded}/
                                              {indivTotal}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full transition-all duration-300 ${
                                                  status === "all"
                                                    ? "bg-green-500"
                                                    : status === "partial"
                                                      ? "bg-yellow-500"
                                                      : "bg-gray-400"
                                                }`}
                                                style={{ width: `${progressPercentage}%` }}
                                              />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">
                                              {Math.round(progressPercentage)}%
                                            </span>
                                          </div>
                                          {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                          )}
                                        </div>
                                      </div>
                                    </button>

                                    {/* Collapsible Detailed Grading Section */}
                                    {isExpanded && (
                                      <div className="p-6 bg-white">
                                        <div className="space-y-6">
                                          {/* Group Criteria */}
                                          {criteria.filter((c) => !c.individual).length > 0 && (
                                            <div>
                                              <h5 className="font-semibold text-md mb-2 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-green-600" /> Critères de groupe
                                              </h5>
                                              <div className="space-y-2">
                                                {criteria
                                                  .filter((c) => !c.individual)
                                                  .map((criterion) => {
                                                    const maxScore = (criterion.weight / 100) * 20;
                                                    const key = `${criterion.id}-${group.id}`;
                                                    const gradeValue = getGradeValue(criterion.id, group.id);
                                                    const hasComment = !!getGradeComment(criterion.id, group.id);
                                                    return (
                                                      <div
                                                        key={criterion.id}
                                                        className="border rounded-lg p-3 hover:bg-gray-50/50 transition-colors"
                                                      >
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-3 flex-1">
                                                            <span className="font-medium">{criterion.name}</span>
                                                            <Badge variant="secondary" className="text-xs">
                                                              {criterion.weight}% • Max: {maxScore.toFixed(1)}pts
                                                            </Badge>
                                                          </div>
                                                          <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                              <Slider
                                                                value={[gradeValue]}
                                                                onValueChange={(value) => {
                                                                  handleGradeChange(criterion.id, group.id, value);
                                                                }}
                                                                max={maxScore}
                                                                step={0.5}
                                                                className="flex-1"
                                                              />
                                                              <span className="font-bold text-lg min-w-[60px] text-right">
                                                                {gradeValue.toFixed(1)}
                                                              </span>
                                                            </div>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => {
                                                                toggleComment(key);
                                                              }}
                                                            >
                                                              <MessageSquare
                                                                className={`h-4 w-4 ${hasComment ? "text-blue-500" : "text-gray-400"}`}
                                                              />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                        {showComments.has(key) && (
                                                          <div className="mt-2">
                                                            <Textarea
                                                              placeholder="Ajouter un commentaire..."
                                                              value={getGradeComment(criterion.id, group.id)}
                                                              onChange={(e) => {
                                                                handleCommentChange(
                                                                  criterion.id,
                                                                  group.id,
                                                                  e.target.value,
                                                                );
                                                              }}
                                                              className="min-h-[60px]"
                                                            />
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}
                                          {/* Individual Criteria */}
                                          {criteria.filter((c) => c.individual).length > 0 && (
                                            <div>
                                              <h5 className="font-semibold text-md mb-2 flex items-center gap-2">
                                                <User className="w-4 h-4 text-purple-600" /> Critères individuels
                                              </h5>
                                              <div className="space-y-2">
                                                {criteria
                                                  .filter((c) => c.individual)
                                                  .map((criterion) => {
                                                    const maxScore = (criterion.weight / 100) * 20;
                                                    return (
                                                      <div
                                                        key={criterion.id}
                                                        className="border rounded-lg p-3 hover:bg-purple-50/50 transition-colors"
                                                      >
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-3 flex-1">
                                                            <span className="font-medium">{criterion.name}</span>
                                                            <Badge variant="secondary" className="text-xs">
                                                              {criterion.weight}% • Max: {maxScore.toFixed(1)}pts
                                                            </Badge>
                                                          </div>
                                                        </div>
                                                        <div className="space-y-2 mt-2">
                                                          {group.members.map((member) => {
                                                            const key = `${criterion.id}-${group.id}-${member.id}`;
                                                            const gradeValue = getGradeValue(
                                                              criterion.id,
                                                              group.id,
                                                              member.id,
                                                            );
                                                            const hasComment = !!getGradeComment(
                                                              criterion.id,
                                                              group.id,
                                                              member.id,
                                                            );
                                                            return (
                                                              <div
                                                                key={member.id}
                                                                className="flex items-center gap-2 border rounded p-2 bg-white"
                                                              >
                                                                <span
                                                                  className="w-32 truncate"
                                                                  title={`${member.firstname} ${member.lastname}`}
                                                                >
                                                                  {member.firstname} {member.lastname.charAt(0)}.
                                                                </span>
                                                                <Slider
                                                                  value={[gradeValue]}
                                                                  onValueChange={(value) => {
                                                                    handleIndividualGradeChange(
                                                                      criterion.id,
                                                                      group.id,
                                                                      member.id,
                                                                      value,
                                                                    );
                                                                  }}
                                                                  max={maxScore}
                                                                  step={0.5}
                                                                  className="flex-1"
                                                                />
                                                                <span className="font-bold text-base min-w-[50px] text-right">
                                                                  {gradeValue.toFixed(1)}
                                                                </span>
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() => {
                                                                    toggleComment(key);
                                                                  }}
                                                                >
                                                                  <MessageSquare
                                                                    className={`h-4 w-4 ${hasComment ? "text-blue-500" : "text-gray-400"}`}
                                                                  />
                                                                </Button>
                                                                {showComments.has(key) && (
                                                                  <div className="ml-2 flex-1">
                                                                    <Textarea
                                                                      placeholder="Ajouter un commentaire..."
                                                                      value={getGradeComment(
                                                                        criterion.id,
                                                                        group.id,
                                                                        member.id,
                                                                      )}
                                                                      onChange={(e) => {
                                                                        handleCommentChange(
                                                                          criterion.id,
                                                                          group.id,
                                                                          e.target.value,
                                                                          member.id,
                                                                        );
                                                                      }}
                                                                      className="min-h-[40px]"
                                                                    />
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
