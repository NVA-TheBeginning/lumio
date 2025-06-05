"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Filter, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { getAllStudentProjects } from "../../teachers/projects/actions";

interface FilterState {
  hasGroup: string;
  search: string;
}

const groupStatusOptions = [
  { label: "Tous", value: "all" },
  { label: "Avec groupe", value: "grouped" },
  { label: "Sans groupe", value: "ungrouped" },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Needed for complex filtering and sorting logic
export default function ProjectList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterState>({
    hasGroup: "all",
    search: "",
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9);

  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", currentPage, itemsPerPage],
    queryFn: async () => {
      return await getAllStudentProjects(currentPage, itemsPerPage);
    },
    staleTime: 5 * 60 * 1000,
  });

  const projects = projectsResponse?.data || [];
  const pagination = projectsResponse?.pagination || {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
  };

  useEffect(() => {
    let count = 0;
    if (filters.hasGroup !== "all") count++;
    if (filters.search.trim() !== "") count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const filteredProjects = useMemo(() => {
    if (isLoadingProjects) return [];

    return projects.filter((project) => {
      const matchesSearch =
        filters.search === "" ||
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesGroupStatus =
        filters.hasGroup === "all" ||
        (filters.hasGroup === "grouped" && project.group !== null) ||
        (filters.hasGroup === "ungrouped" && project.group === null);

      return matchesSearch && matchesGroupStatus;
    });
  }, [filters, projects, isLoadingProjects]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === "title") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [filteredProjects, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearAllFilters = () => {
    setFilters({
      hasGroup: "all",
      search: "",
    });
  };

  const handleViewProject = (projectId: number) => {
    router.push(`/dashboard/student/projects/${projectId}`);
  };

  const handleItemsPerPageChange = (newSize: string) => {
    setItemsPerPage(Number.parseInt(newSize));
    setCurrentPage(1);
  };

  if (isErrorProjects) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 border rounded-lg bg-red-50 text-red-800">
          <h3 className="text-lg font-medium">Erreur lors du chargement des projets</h3>
          <p className="mt-2">
            {projectsError instanceof Error ? projectsError.message : "Une erreur s'est produite. Veuillez réessayer."}
          </p>
          <Button className="mt-4" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Projets</h1>
          {!isLoadingProjects ? (
            <p className="text-gray-500 mt-1">
              {pagination.totalRecords} projet{pagination.totalRecords !== 1 ? "s" : ""} au total
              {sortedProjects.length !== projects.length && (
                <span>
                  , {sortedProjects.length} affiché{sortedProjects.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          ) : (
            <Skeleton className="h-6 w-32 mt-2" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un projet..."
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
                  <div className="space-y-2">
                    <h4 className="font-medium">Statut du groupe</h4>
                    <Select
                      value={filters.hasGroup}
                      onValueChange={(value: string) => handleFilterChange({ hasGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupStatusOptions.map((option) => (
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Trier
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className={sortBy === "date" && sortOrder === "desc" ? "bg-accent" : ""}
                  onClick={() => {
                    setSortBy("date");
                    setSortOrder("desc");
                  }}
                >
                  Date (récent → ancien)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={sortBy === "date" && sortOrder === "asc" ? "bg-accent" : ""}
                  onClick={() => {
                    setSortBy("date");
                    setSortOrder("asc");
                  }}
                >
                  Date (ancien → récent)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={sortBy === "title" && sortOrder === "asc" ? "bg-accent" : ""}
                  onClick={() => {
                    setSortBy("title");
                    setSortOrder("asc");
                  }}
                >
                  Titre (A → Z)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={sortBy === "title" && sortOrder === "desc" ? "bg-accent" : ""}
                  onClick={() => {
                    setSortBy("title");
                    setSortOrder("desc");
                  }}
                >
                  Titre (Z → A)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {filters.hasGroup !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                {groupStatusOptions.find((opt) => opt.value === filters.hasGroup)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ hasGroup: "all" })} />
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

      {isLoadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-1/5" />
                </div>
              </CardHeader>
              <CardContent className="grow pb-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Aucun projet trouvé</h3>
          <p className="mt-2 text-gray-600">
            {activeFiltersCount > 0
              ? "Essayez de modifier vos filtres pour voir plus de projets."
              : "Vous n'avez pas encore de projets assignés."}
          </p>
          {activeFiltersCount > 0 && (
            <Button className="mt-4" variant="outline" onClick={clearAllFilters}>
              Effacer les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl line-clamp-2">{project.name}</CardTitle>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <CardDescription className="text-sm">{formatDate(project.createdAt.toString())}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grow pb-3">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  {project.group ? (
                    <span className="text-green-600">
                      Groupe: {project.group.name || `Groupe #${project.group.id}`}
                    </span>
                  ) : (
                    <span className="text-orange-600">Aucun groupe assigné</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button size="sm" onClick={() => handleViewProject(project.id)} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Voir le projet
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingProjects && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          {pagination.prevPage && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.prevPage ?? 1)}
              disabled={!pagination.prevPage}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageToShow: number;

              if (pagination.totalPages <= 5) {
                pageToShow = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageToShow = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageToShow = pagination.totalPages - 4 + i;
              } else {
                pageToShow = pagination.currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageToShow}
                  variant={pagination.currentPage === pageToShow ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => handlePageChange(pageToShow)}
                  aria-label={`Page ${pageToShow}`}
                  aria-current={pagination.currentPage === pageToShow ? "page" : undefined}
                >
                  {pageToShow}
                </Button>
              );
            })}
          </div>

          {pagination.nextPage && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.nextPage ?? pagination.totalPages)}
              disabled={!pagination.nextPage}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Page {pagination.currentPage} sur {pagination.totalPages}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Projets par page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[9, 18, 27, 36].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
