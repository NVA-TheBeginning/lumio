"use client";

import { ChevronLeft, ChevronRight, Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

interface Project {
  id: number;
  title: string;
  description: string;
  promotions: string[];
  date: string;
  status: "visible" | "draft" | "hidden";
}

interface FilterState {
  promotions: string[];
  dateRange: string;
  status: string[];
  search: string;
}

const mockProjects: Project[] = [
  {
    id: 1,
    title: "Application Web pour Bibliothèque",
    description: "Développement d'une application de gestion pour bibliothèques universitaires",
    promotions: ["Master 2 Informatique", "Licence 3 Informatique"],
    date: "2025-03-15",
    status: "visible",
  },
  {
    id: 2,
    title: "Plateforme de Cours en Ligne",
    description: "Création d'une plateforme e-learning avec système de quiz interactifs",
    promotions: ["Licence 3 Informatique"],
    date: "2025-02-10",
    status: "visible",
  },
  {
    id: 3,
    title: "Application Mobile de Suivi Sportif",
    description: "Application native pour suivre les performances sportives des étudiants",
    promotions: ["Master 1 STAPS", "Master 2 Informatique"],
    date: "2025-01-20",
    status: "draft",
  },
  {
    id: 4,
    title: "Système de Gestion d'Emploi du Temps",
    description: "Application pour gérer les horaires et les salles de cours",
    promotions: ["Master 2 Informatique"],
    date: "2024-12-05",
    status: "visible",
  },
  {
    id: 5,
    title: "Plateforme de Stage",
    description: "Portail web pour gérer les offres et candidatures de stage",
    promotions: ["Licence 3 Informatique", "Master 1 STAPS"],
    date: "2024-11-22",
    status: "visible",
  },
  {
    id: 6,
    title: "Application d'Analyse de Données Sportives",
    description: "Outil d'analyse statistique pour les performances sportives",
    promotions: ["Master 1 STAPS"],
    date: "2024-10-15",
    status: "hidden",
  },
  {
    id: 7,
    title: "Système de Réservation de Salles",
    description: "Application permettant la réservation de salles de cours et de réunion",
    promotions: ["Licence 3 Informatique"],
    date: "2024-09-18",
    status: "hidden",
  },
  {
    id: 8,
    title: "Plateforme d'Échange Étudiant",
    description: "Réseau social interne pour les étudiants de l'université",
    promotions: ["Master 1 STAPS", "Master 2 Informatique"],
    date: "2024-08-30",
    status: "visible",
  },
  {
    id: 9,
    title: "Application de Gestion de Projets Étudiants",
    description: "Outil collaboratif pour la gestion de projets académiques",
    promotions: ["Master 2 Informatique"],
    date: "2024-07-25",
    status: "draft",
  },
];

const getAllPromotions = (): string[] => {
  const promotionSet = new Set<string>();
  mockProjects.forEach((project) => {
    project.promotions.forEach((promotion) => {
      promotionSet.add(promotion);
    });
  });
  return Array.from(promotionSet);
};

const datePeriods = [
  { label: "Tous", value: "all" },
  { label: "Cette année", value: "year" },
  { label: "6 derniers mois", value: "6months" },
  { label: "3 derniers mois", value: "3months" },
];

const ProjectsDashboard = () => {
  const [filters, setFilters] = useState<FilterState>({
    promotions: [],
    dateRange: "all",
    status: [],
    search: "",
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"date" | "title" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9);
  const [activeTab, setActiveTab] = useState<string>("all");

  const promotions = useMemo(() => getAllPromotions(), []);

  useEffect(() => {
    let count = 0;
    if (filters.promotions.length > 0) count++;
    if (filters.dateRange !== "all") count++;
    if (filters.status.length > 0) count++;
    if (filters.search.trim() !== "") count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const filteredProjects = useMemo(() => {
    const now = new Date();

    let dateLimit: Date | null = null;
    if (filters.dateRange === "year") {
      dateLimit = new Date(now.getFullYear(), 0, 1);
    } else if (filters.dateRange === "6months") {
      dateLimit = new Date(now);
      dateLimit.setMonth(now.getMonth() - 6);
    } else if (filters.dateRange === "3months") {
      dateLimit = new Date(now);
      dateLimit.setMonth(now.getMonth() - 3);
    }

    return mockProjects.filter((project) => {
      const matchesTab = activeTab === "all" || project.status === activeTab;

      const matchesPromotion =
        filters.promotions.length === 0 ||
        project.promotions.some((promotion) => filters.promotions.includes(promotion));

      const matchesSearch =
        filters.search === "" ||
        project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase());

      const projectDate = new Date(project.date);
      const matchesDate = filters.dateRange === "all" || (dateLimit && projectDate >= dateLimit);

      const matchesStatus = filters.status.length === 0 || filters.status.includes(project.status);

      return matchesTab && matchesPromotion && matchesSearch && matchesDate && matchesStatus;
    });
  }, [filters, activeTab]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (sortBy === "status") {
        return sortOrder === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [filteredProjects, sortBy, sortOrder]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePromotionToggle = (promotion: string) => {
    setFilters((prev) => {
      const newPromotions = prev.promotions.includes(promotion)
        ? prev.promotions.filter((p) => p !== promotion)
        : [...prev.promotions, promotion];
      return { ...prev, promotions: newPromotions };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      promotions: [],
      dateRange: "all",
      status: [],
      search: "",
    });
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "visible":
        return "default";
      case "draft":
        return "secondary";
      case "hidden":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "visible":
        return "Visible";
      case "draft":
        return "Brouillon";
      case "hidden":
        return "Masqué";
      default:
        return status;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Projets</h1>
          <p className="text-gray-500 mt-1">
            {sortedProjects.length} projet{sortedProjects.length !== 1 ? "s" : ""} trouvé
            {sortedProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {mockProjects.length > 0 && (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-2">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="visible">Visibles</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="hidden">Masqués</TabsTrigger>
        </TabsList>
      </Tabs>

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
                    <h4 className="font-medium">Promotions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {promotions.map((promotion) => (
                        <div key={promotion} className="flex items-center space-x-2">
                          <Checkbox
                            id={`promotion-${promotion}`}
                            checked={filters.promotions.includes(promotion)}
                            onCheckedChange={() => handlePromotionToggle(promotion)}
                          />
                          <Label htmlFor={`promotion-${promotion}`} className="text-sm">
                            {promotion}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Période</h4>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value: string) => handleFilterChange({ dateRange: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une période" />
                      </SelectTrigger>
                      <SelectContent>
                        {datePeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={clearAllFilters}>
                      Réinitialiser
                    </Button>
                    <Button size="sm">Appliquer</Button>
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
            {filters.promotions.map((promotion) => (
              <Badge key={promotion} variant="outline" className="flex items-center gap-1">
                {promotion}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handlePromotionToggle(promotion)} />
              </Badge>
            ))}
            {filters.dateRange !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                {datePeriods.find((p) => p.value === filters.dateRange)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ dateRange: "all" })} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProjects.map((project) => (
          <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl line-clamp-2">{project.title}</CardTitle>
              </div>
              <div className="flex justify-between items-center mt-2">
                <CardDescription className="text-sm">{formatDate(project.date)}</CardDescription>
                <Badge variant={getStatusBadgeVariant(project.status)}>{getStatusDisplayText(project.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow pb-3">
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {project.promotions.map((promotion) => (
                  <Badge key={promotion} variant="secondary" className="text-xs">
                    {promotion}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <Button variant="default" size="sm">
                Voir détails
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {paginatedProjects.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium">Aucun projet trouvé</h3>
          <p className="text-gray-500 mt-2">Modifiez vos critères de recherche ou créez un nouveau projet</p>
          <Button className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageToShow: number;

              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageToShow}
                  variant={currentPage === pageToShow ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => handlePageChange(pageToShow)}
                  aria-label={`Page ${pageToShow}`}
                  aria-current={currentPage === pageToShow ? "page" : undefined}
                >
                  {pageToShow}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Projets par page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value: string) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="9" />
            </SelectTrigger>
            <SelectContent>
              {[9, 18, 27].map((value) => (
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
};

export default ProjectsDashboard;
