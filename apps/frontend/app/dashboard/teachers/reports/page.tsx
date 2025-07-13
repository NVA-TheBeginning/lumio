"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Eye, FileText, Filter, Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import ReportEditor from "@/components/report-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, isNotEmpty, isNotNull } from "@/lib/utils";
import { getReports } from "./actions";

type ViewMode = "list" | "viewer";

interface FilterState {
  projectIds: number[];
  promotionIds: number[];
  search: string;
  status: "all" | "submitted" | "draft";
}

const statusOptions = [
  { label: "Tous", value: "all" },
  { label: "Soumis", value: "submitted" },
  { label: "Brouillon", value: "draft" },
];

export default function TeacherReportsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    projectIds: [],
    promotionIds: [],
    search: "",
    status: "all",
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["teacher-reports", filters],
    queryFn: () =>
      getReports({
        projectId: filters.projectIds.length === 1 ? filters.projectIds[0] : undefined,
        promotionId: filters.promotionIds.length === 1 ? filters.promotionIds[0] : undefined,
      }),
  });

  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setViewMode("viewer");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedReportId(null);
  };

  const { projects, promotions } = useMemo(() => {
    if (!reports) return { projects: [], promotions: [] };

    const projectsMap = new Map<number, string>();
    const promotionsMap = new Map<number, string>();

    reports.forEach((report) => {
      if (report.project) {
        projectsMap.set(report.project.id, report.project.name);
      }
      if (report.promotion) {
        promotionsMap.set(report.promotion.id, report.promotion.name);
      }
    });

    return {
      projects: Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name })),
      promotions: Array.from(promotionsMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];

    return reports.filter((report): report is typeof report => {
      const matchesProject =
        filters.projectIds.length === 0 ||
        (report.project !== undefined && filters.projectIds.includes(report.project.id));
      const matchesPromotion =
        filters.promotionIds.length === 0 ||
        (report.promotion !== undefined && filters.promotionIds.includes(report.promotion.id));
      const matchesSearch =
        filters.search === "" ||
        report.sections.some(
          (section) =>
            section.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            Boolean(section.contentMarkdown?.toLowerCase().includes(filters.search.toLowerCase())),
        ) ||
        Boolean(report.project?.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        Boolean(report.group?.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        report.group?.members.some((member) =>
          `${member.firstname} ${member.lastname}`.toLowerCase().includes(filters.search.toLowerCase()),
        );
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "submitted" && Boolean(report.submittedAt)) ||
        (filters.status === "draft" && !report.submittedAt);

      return Boolean(matchesProject) && Boolean(matchesPromotion) && Boolean(matchesSearch) && Boolean(matchesStatus);
    });
  }, [reports, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.projectIds.length > 0) count++;
    if (filters.promotionIds.length > 0) count++;
    if (filters.search.trim() !== "") count++;
    if (filters.status !== "all") count++;
    return count;
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleProjectToggle = (projectId: number) => {
    setFilters((prev) => {
      const newProjectIds = prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId];
      return { ...prev, projectIds: newProjectIds };
    });
  };

  const handlePromotionToggle = (promotionId: number) => {
    setFilters((prev) => {
      const newPromotionIds = prev.promotionIds.includes(promotionId)
        ? prev.promotionIds.filter((id) => id !== promotionId)
        : [...prev.promotionIds, promotionId];
      return { ...prev, promotionIds: newPromotionIds };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      projectIds: [],
      promotionIds: [],
      search: "",
      status: "all",
    });
  };

  if (viewMode === "viewer" && selectedReportId !== null) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux rapports
          </Button>
        </div>
        <ReportEditor reportId={selectedReportId} readOnly />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Rapports des Étudiants</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rapports des Étudiants</h1>
          <p className="text-gray-500 mt-1">
            {filteredReports.length} rapport{filteredReports.length !== 1 ? "s" : ""} trouvé
            {filteredReports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  {projects.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Projets</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={filters.projectIds.includes(project.id)}
                              onCheckedChange={() => handleProjectToggle(project.id)}
                            />
                            <Label htmlFor={`project-${project.id}`} className="text-sm">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {promotions.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Promotions</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {promotions.map((promotion) => (
                          <div key={promotion.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`promotion-${promotion.id}`}
                              checked={filters.promotionIds.includes(promotion.id)}
                              onCheckedChange={() => handlePromotionToggle(promotion.id)}
                            />
                            <Label htmlFor={`promotion-${promotion.id}`} className="text-sm">
                              {promotion.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Statut</h4>
                    <Select
                      value={filters.status}
                      onValueChange={(value: "all" | "submitted" | "draft") => handleFilterChange({ status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={clearAllFilters}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {filters.projectIds.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              return (
                <Badge key={projectId} variant="outline" className="flex items-center gap-1">
                  {project?.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleProjectToggle(projectId)} />
                </Badge>
              );
            })}
            {filters.promotionIds.map((promotionId) => {
              const promotion = promotions.find((p) => p.id === promotionId);
              return (
                <Badge key={promotionId} variant="outline" className="flex items-center gap-1">
                  {promotion?.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handlePromotionToggle(promotionId)} />
                </Badge>
              );
            })}
            {filters.status !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                {statusOptions.find((s) => s.value === filters.status)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ status: "all" })} />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="outline" className="flex items-center gap-1">
                Recherche: {filters.search}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ search: "" })} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllFilters}>
              Effacer tout
            </Button>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      {isNotNull(filteredReports) && filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const isEmpty = report.sections.length === 0;
            const hasEmptyContent =
              report.sections.length > 0 &&
              report.sections.every(
                (section) => !isNotEmpty(section.contentMarkdown) || section.contentMarkdown.trim() === "",
              );

            return (
              <Card
                key={report.id}
                className={`hover:shadow-md transition-shadow ${isEmpty || hasEmptyContent ? "border-orange-200 bg-orange-50/50" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className={`w-5 h-5 ${isEmpty || hasEmptyContent ? "text-orange-500" : ""}`} />
                    <span>
                      Rapport {isNotEmpty(report.group?.name) ? `(${report.group.name})` : ""} #{report.id}
                    </span>
                    {isEmpty && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100">
                        Vide
                      </Badge>
                    )}
                    {report.submittedAt ? (
                      <Badge variant="default" className="ml-auto">
                        Soumis
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">
                        Brouillon
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {report.project?.name ?? `Projet ${report.projectId}`} •{" "}
                        {report.promotion?.name ?? `Promotion ${report.promotionId}`}
                      </span>
                    </div>
                    {report.group && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Groupe:</strong> {report.group.name}
                        {report.group.members.length > 0 && (
                          <div className="mt-1">
                            <strong>Membres:</strong>{" "}
                            {report.group.members.map((member) => `${member.firstname} ${member.lastname}`).join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {report.sections.length === 0 ? (
                        <span className="text-orange-600 font-medium">Rapport vide - Aucune section</span>
                      ) : (
                        `${report.sections.length} section${report.sections.length > 1 ? "s" : ""}`
                      )}
                    </p>
                    {report.sections.length > 0 &&
                      report.sections.every(
                        (section) => !isNotEmpty(section.contentMarkdown) || section.contentMarkdown.trim() === "",
                      ) && <p className="text-sm text-orange-600 font-medium">⚠️ Sections sans contenu</p>}
                    {report.updatedAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Modifié le {formatDate(report.updatedAt.toString())}
                      </p>
                    )}
                    {report.submittedAt && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Soumis le {formatDate(report.submittedAt.toString())}
                      </p>
                    )}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye className="w-4 h-4" />
                        Consulter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-gray-50">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun rapport trouvé</h3>
          {reports?.length === 0 ? (
            <div className="space-y-2">
              <p className="text-gray-600">Aucun rapport n'a encore été créé par les étudiants.</p>
              <p className="text-sm text-gray-500">
                Les rapports apparaîtront ici une fois que les étudiants commenceront à travailler sur leurs projets.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Aucun rapport ne correspond à vos critères de recherche.</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Essayez de :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Modifier votre terme de recherche</li>
                  <li>Ajuster les filtres de projet ou promotion</li>
                  <li>Changer le statut de soumission</li>
                </ul>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
