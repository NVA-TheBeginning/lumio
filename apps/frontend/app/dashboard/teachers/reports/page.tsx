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
import { formatDate } from "@/lib/utils";
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

  // Extract unique projects and promotions from reports for filtering
  const { projects, promotions } = useMemo(() => {
    if (!reports) return { projects: [], promotions: [] };

    const projectsMap = new Map<number, string>();
    const promotionsMap = new Map<number, string>();

    reports.forEach((report) => {
      projectsMap.set(report.projectId, `Projet ${report.projectId}`);
      promotionsMap.set(report.promotionId, `Promotion ${report.promotionId}`);
    });

    return {
      projects: Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name })),
      promotions: Array.from(promotionsMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];

    return reports.filter((report) => {
      const matchesProject = filters.projectIds.length === 0 || filters.projectIds.includes(report.projectId);
      const matchesPromotion = filters.promotionIds.length === 0 || filters.promotionIds.includes(report.promotionId);
      const matchesSearch =
        filters.search === "" ||
        report.sections.some(
          (section) =>
            section.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            section.contentMarkdown?.toLowerCase().includes(filters.search.toLowerCase()),
        );
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "submitted" && report.submittedAt) ||
        (filters.status === "draft" && !report.submittedAt);

      return matchesProject && matchesPromotion && matchesSearch && matchesStatus;
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
              placeholder="Rechercher dans les rapports..."
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
      {filteredReports && filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>Rapport #{report.id}</span>
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
                      Projet {report.projectId} • Promotion {report.promotionId}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.sections.length} section{report.sections.length > 1 ? "s" : ""}
                  </p>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Aucun rapport trouvé</h3>
          <p className="text-gray-500 mt-2">
            {reports?.length === 0
              ? "Aucun rapport n'a encore été créé par les étudiants"
              : "Modifiez vos critères de recherche pour afficher plus de rapports"}
          </p>
        </div>
      )}
    </div>
  );
}
