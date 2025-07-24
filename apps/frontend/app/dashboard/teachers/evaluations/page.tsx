"use client";

import { useQuery } from "@tanstack/react-query";
import { BookCheck, Copy, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyCriteriaDialog } from "@/components/evaluations/copy-criteria-dialog";
import { EvaluationProjectCard } from "@/components/evaluations/evaluation-project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllProjectsWithCriteria, type ProjectWithCriteria } from "./actions";

interface FilterState {
  search: string;
  sortBy: "name" | "date" | "criteria";
  sortOrder: "asc" | "desc";
}

export default function EvaluationsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const [activeTab, setActiveTab] = useState<"with-criteria" | "without-criteria">("with-criteria");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedSourceProject, setSelectedSourceProject] = useState<ProjectWithCriteria | null>(null);
  const [selectedTargetProject, setSelectedTargetProject] = useState<ProjectWithCriteria | null>(null);

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["evaluations-projects"],
    queryFn: getAllProjectsWithCriteria,
    staleTime: 5 * 60 * 1000,
  });

  const { projectsWithCriteria, projectsWithoutCriteria } = useMemo(() => {
    const withCriteria: ProjectWithCriteria[] = [];
    const withoutCriteria: ProjectWithCriteria[] = [];

    projects.forEach((project) => {
      const hasCriteria = project.promotions.some((promotion) => promotion.criteria && promotion.criteria.length > 0);

      if (hasCriteria) {
        withCriteria.push(project);
      } else {
        withoutCriteria.push(project);
      }
    });

    return { projectsWithCriteria: withCriteria, projectsWithoutCriteria: withoutCriteria };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const currentProjects = activeTab === "with-criteria" ? projectsWithCriteria : projectsWithoutCriteria;

    let filtered = currentProjects.filter((project) => {
      const matchesSearch =
        filters.search === "" ||
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSearch;
    });

    // Sort projects
    filtered = [...filtered].sort((a, b) => {
      if (filters.sortBy === "name") {
        const comparison = a.name.localeCompare(b.name);
        return filters.sortOrder === "asc" ? comparison : -comparison;
      }

      if (filters.sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (filters.sortBy === "criteria") {
        const criteriaA = a.promotions.reduce((total, p) => total + (p.criteria?.length || 0), 0);
        const criteriaB = b.promotions.reduce((total, p) => total + (p.criteria?.length || 0), 0);
        return filters.sortOrder === "asc" ? criteriaA - criteriaB : criteriaB - criteriaA;
      }

      return 0;
    });

    return filtered;
  }, [projectsWithCriteria, projectsWithoutCriteria, activeTab, filters]);

  const handleCopyFrom = (project: ProjectWithCriteria) => {
    setSelectedSourceProject(project);
    if (selectedTargetProject) {
      setCopyDialogOpen(true);
    } else {
      setActiveTab("without-criteria");
    }
  };

  const handleCopyTo = (project: ProjectWithCriteria) => {
    setSelectedTargetProject(project);
    if (selectedSourceProject) {
      setCopyDialogOpen(true);
    } else {
      setActiveTab("with-criteria");
    }
  };

  const openCopyDialog = () => {
    if (selectedSourceProject && selectedTargetProject) {
      setCopyDialogOpen(true);
    }
  };

  const closeCopyDialog = () => {
    setCopyDialogOpen(false);
    setSelectedSourceProject(null);
    setSelectedTargetProject(null);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 border rounded-lg bg-red-50 text-red-800">
          <h3 className="text-lg font-medium">Erreur lors du chargement des projets</h3>
          <p className="mt-2">
            {error instanceof Error ? error.message : "Une erreur s'est produite. Veuillez réessayer."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookCheck className="h-8 w-8 text-blue-600" />
            Gestion des Évaluations
          </h1>
          <p className="text-gray-500 mt-1">Copiez les critères d'évaluation entre vos projets</p>
        </div>

        {selectedSourceProject && selectedTargetProject && (
          <Button onClick={openCopyDialog} className="mt-4 md:mt-0">
            <Copy className="mr-2 h-4 w-4" />
            Copier les critères
          </Button>
        )}
      </div>

      {/* Selected Projects Summary */}
      {(selectedSourceProject || selectedTargetProject) && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Sélection pour copie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Projet source :</div>
                {selectedSourceProject ? (
                  <div className="text-sm bg-green-100 rounded p-2 mt-1">{selectedSourceProject.name}</div>
                ) : (
                  <div className="text-sm text-gray-500 italic mt-1">Sélectionnez un projet avec critères</div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Projet cible :</div>
                {selectedTargetProject ? (
                  <div className="text-sm bg-blue-100 rounded p-2 mt-1">{selectedTargetProject.name}</div>
                ) : (
                  <div className="text-sm text-gray-500 italic mt-1">Sélectionnez un projet sans critères</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un projet..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [typeof filters.sortBy, typeof filters.sortOrder];
            setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (récent → ancien)</SelectItem>
            <SelectItem value="date-asc">Date (ancien → récent)</SelectItem>
            <SelectItem value="name-asc">Nom (A → Z)</SelectItem>
            <SelectItem value="name-desc">Nom (Z → A)</SelectItem>
            <SelectItem value="criteria-desc">Plus de critères</SelectItem>
            <SelectItem value="criteria-asc">Moins de critères</SelectItem>
          </SelectContent>
        </Select>

        {filters.search && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as "with-criteria" | "without-criteria")}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="with-criteria" className="flex items-center gap-2">
            <BookCheck className="h-4 w-4" />
            Avec critères ({projectsWithCriteria.length})
          </TabsTrigger>
          <TabsTrigger value="without-criteria" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Sans critères ({projectsWithoutCriteria.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="with-criteria" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Projets avec critères d'évaluation</h2>
            <p className="text-gray-600 text-sm mb-4">
              Ces projets ont des critères d'évaluation configurés. Vous pouvez les utiliser comme source pour copier
              vers d'autres projets.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="flex flex-col h-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <BookCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium mt-4">Aucun projet avec critères trouvé</h3>
              <p className="text-gray-500 mt-2">
                {filters.search ? "Modifiez votre recherche ou" : ""} Créez des critères d'évaluation dans vos projets
                pour les voir ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <EvaluationProjectCard key={project.id} project={project} showCopyFrom onCopyFrom={handleCopyFrom} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="without-criteria" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Projets sans critères d'évaluation</h2>
            <p className="text-gray-600 text-sm mb-4">
              Ces projets n'ont pas encore de critères d'évaluation. Vous pouvez copier des critères depuis d'autres
              projets.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="flex flex-col h-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <Copy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium mt-4">Aucun projet sans critères trouvé</h3>
              <p className="text-gray-500 mt-2">
                {filters.search
                  ? "Modifiez votre recherche ou tous vos projets ont déjà des critères d'évaluation."
                  : "Tous vos projets ont déjà des critères d'évaluation."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <EvaluationProjectCard key={project.id} project={project} showCopyTo onCopyTo={handleCopyTo} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Copy Dialog */}
      <CopyCriteriaDialog
        isOpen={copyDialogOpen}
        onClose={closeCopyDialog}
        sourceProject={selectedSourceProject || undefined}
        targetProject={selectedTargetProject || undefined}
      />
    </div>
  );
}
