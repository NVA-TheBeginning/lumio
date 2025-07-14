"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  acceptSubmission,
  checkPlagiarism,
  getAllPromotionSubmissions,
  getProjectByIdTeacher,
  getSubmissionDownloadData,
  PromotionSubmissionMetadataResponse,
} from "@/app/dashboard/teachers/projects/actions";
import { PlagiarismDetailsDialog } from "@/components/projects/plagiarism-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadSubmission } from "@/lib/download-utils";
import { formatBytes, formatDate, isNotEmpty } from "@/lib/utils";

export default function ProjectSubmissionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = Number(params.projectId);
  const initialPromotionId = searchParams.get("promotionId");
  const initialDeliverableId = searchParams.get("deliverableId");
  const queryClient = useQueryClient();

  const [activePromotion, setActivePromotion] = useState<string>(initialPromotionId ?? "");
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>(initialDeliverableId ?? "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [acceptingSubmissions, setAcceptingSubmissions] = useState<Set<number>>(new Set());

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["projects", Number(projectId)],
    queryFn: () => getProjectByIdTeacher(projectId),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["promotion-submissions", activePromotion, projectId],
    queryFn: () => getAllPromotionSubmissions(Number(activePromotion), projectId),
    enabled: !!activePromotion,
  });

  const acceptSubmissionMutation = useMutation({
    mutationFn: acceptSubmission,
    onSuccess: (_, submissionId) => {
      toast.success("Soumission acceptée avec succès");
      void queryClient.invalidateQueries({
        queryKey: ["promotion-submissions", activePromotion, projectId],
      });
      setAcceptingSubmissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    },
    onError: (error, submissionId) => {
      console.error("Erreur lors de l'acceptation:", error);
      toast.error("Erreur lors de l'acceptation de la soumission");
      setAcceptingSubmissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    },
  });

  const plagiarismCheckMutation = useMutation({
    mutationFn: ({
      projectId,
      promotionId,
      deliverableId,
    }: {
      projectId: string;
      promotionId: string;
      deliverableId: string;
    }) => checkPlagiarism(projectId, promotionId, deliverableId),
    onSuccess: (data, { deliverableId }) => {
      toast.success("Vérification de plagiat terminée");
      queryClient.setQueryData(["plagiarism-results", activePromotion, projectId, deliverableId], data);
    },
    onError: (error) => {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Erreur lors de la vérification de plagiat");
    },
  });

  useMemo(() => {
    if (project && !activePromotion && project.promotions.length > 0 && project.promotions[0]) {
      setActivePromotion(project.promotions[0].id.toString());
    }
  }, [project, activePromotion]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return <Badge className="bg-green-500">Accepté</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "late":
        return <Badge className="bg-orange-500">En retard</Badge>;
      case "passed":
        return <Badge className="bg-green-500">Validé</Badge>;
      case "failed":
        return <Badge variant="destructive">Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliverableName = (deliverableId: number) => {
    const deliverable = project?.deliverables.find((d) => d.id === deliverableId);
    return deliverable?.name ?? `Livrable #${deliverableId}`;
  };

  const getGroupName = (groupId: number) => {
    const promotion = project?.promotions.find((p) => p.id.toString() === activePromotion);
    const group = promotion?.groups.find((g) => g.id === groupId);
    return group?.name ?? `Groupe #${groupId}`;
  };

  const handleDownloadSubmission = async (submissionId: number) => {
    try {
      toast.info("Téléchargement en cours...");
      await downloadSubmission(submissionId, getSubmissionDownloadData);
      toast.success("Téléchargement terminé");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleAcceptSubmission = async (submissionId: number) => {
    setAcceptingSubmissions((prev) => new Set(prev).add(submissionId));
    await acceptSubmissionMutation.mutateAsync(submissionId);
  };

  const handleCheckPlagiarism = (deliverableId: number) => {
    if (!activePromotion) return;

    plagiarismCheckMutation.mutate({
      projectId: projectId.toString(),
      promotionId: activePromotion,
      deliverableId: deliverableId.toString(),
    });
  };

  const getPlagiarismResultForSubmission = useMemo(() => {
    return (groupId: number, deliverableId: number) => {
      const plagiarismQuery = queryClient.getQueryData<{
        projectId: string;
        promotionId: string;
        folderResults: {
          folderName: string;
          sha1: string | null;
          plagiarismPercentage: number;
          matches: {
            matchedFolder: string;
            overallMatchPercentage: number;
            combinedScore: number;
            flags: string[];
          }[];
        }[];
      }>(["plagiarism-results", activePromotion, projectId, deliverableId.toString()]);
      if (!plagiarismQuery) return null;

      return plagiarismQuery.folderResults.find((folder) => folder.folderName.startsWith(`${groupId}-`));
    };
  }, [activePromotion, projectId, queryClient]);

  const getPlagiarismBadge = (
    plagiarismPercentage: number,
    plagiarismResult?: PromotionSubmissionMetadataResponse["plagiarismResult"],
  ) => {
    const badge = (() => {
      if (plagiarismPercentage >= 70) {
        return <Badge variant="destructive">Plagiat élevé ({plagiarismPercentage}%)</Badge>;
      }
      if (plagiarismPercentage >= 50) {
        return <Badge className="bg-orange-500">Plagiat moyen ({plagiarismPercentage}%)</Badge>;
      }
      if (plagiarismPercentage >= 20) {
        return <Badge className="bg-yellow-500">Plagiat faible ({plagiarismPercentage}%)</Badge>;
      }
      return <Badge className="bg-green-500">Pas de plagiat détecté ({plagiarismPercentage}%)</Badge>;
    })();

    if (plagiarismResult) {
      return (
        <PlagiarismDetailsDialog plagiarismResult={plagiarismResult}>
          <button type="button" className="cursor-pointer hover:opacity-80 transition-opacity">
            {badge}
          </button>
        </PlagiarismDetailsDialog>
      );
    }

    return badge;
  };

  const filteredSubmissions = (() => {
    if (!submissions) return [];

    return submissions.filter((submission) => {
      if (selectedDeliverable !== "all" && submission.deliverableId.toString() !== selectedDeliverable) {
        return false;
      }

      if (statusFilter !== "all" && submission.status.toLowerCase() !== statusFilter) {
        return false;
      }

      if (searchTerm) {
        const groupName = getGroupName(submission.groupId).toLowerCase();
        const fileName = submission.fileName.toLowerCase();
        const deliverableName = getDeliverableName(submission.deliverableId).toLowerCase();

        return (
          groupName.includes(searchTerm.toLowerCase()) ||
          fileName.includes(searchTerm.toLowerCase()) ||
          deliverableName.includes(searchTerm.toLowerCase())
        );
      }

      return true;
    });
  })();

  const submissionsByDeliverable = useMemo(() => {
    return filteredSubmissions.reduce(
      (acc, submission) => {
        const deliverableId = submission.deliverableId;
        acc[deliverableId] ??= [];
        acc[deliverableId].push(submission);
        return acc;
      },
      {} as Record<number, PromotionSubmissionMetadataResponse[]>,
    );
  }, [filteredSubmissions]);

  const availableDeliverables = useMemo(() => {
    if (!(project && activePromotion)) return [];
    return project.deliverables.filter((d) => d.promotionId === Number(activePromotion));
  }, [project, activePromotion]);

  if (projectLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement du projet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Projet non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/teachers/projects/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Soumissions pour {project.name}</h1>
            </div>
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
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par groupe, fichier ou livrable..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedDeliverable} onValueChange={setSelectedDeliverable}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Tous les livrables" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les livrables</SelectItem>
                            {availableDeliverables.map((deliverable) => (
                              <SelectItem key={deliverable.id} value={deliverable.id.toString()}>
                                {deliverable.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="accepted">Accepté</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="late">En retard</SelectItem>
                          <SelectItem value="passed">Validé</SelectItem>
                          <SelectItem value="failed">Échec</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {filteredSubmissions.length} soumission{filteredSubmissions.length > 1 ? "s" : ""} trouvée
                        {filteredSubmissions.length > 1 ? "s" : ""}
                      </span>
                      {submissions && filteredSubmissions.length !== submissions.length && (
                        <span>sur {submissions.length} au total</span>
                      )}
                    </div>
                  </div>

                  {submissionsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <FileText className="h-5 w-5 mr-2" />
                      {submissions?.length === 0
                        ? "Aucune soumission trouvée pour cette promotion"
                        : "Aucune soumission ne correspond aux filtres sélectionnés"}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(submissionsByDeliverable).map(([deliverableId, deliverableSubmissions]) => (
                        <Card key={deliverableId}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                              <div>
                                {getDeliverableName(Number(deliverableId))}
                                <Badge variant="outline" className="ml-2">
                                  {deliverableSubmissions.length} soumission
                                  {deliverableSubmissions.length > 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckPlagiarism(Number(deliverableId))}
                                disabled={plagiarismCheckMutation.isPending}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                {plagiarismCheckMutation.isPending ? "Vérification..." : "Vérifier plagiat"}
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {deliverableSubmissions.map((submission) => (
                                <div
                                  key={submission.submissionId}
                                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-medium">{getGroupName(submission.groupId)}</h4>
                                      {getStatusBadge(submission.status)}
                                      {submission.penalty > 0 && (
                                        <Badge variant="outline" className="text-orange-600">
                                          -{submission.penalty}% pénalité
                                        </Badge>
                                      )}
                                      {Boolean(submission.error) && <Badge variant="destructive">Erreur fichier</Badge>}
                                      {(() => {
                                        const plagiarismResult = getPlagiarismResultForSubmission(
                                          submission.groupId,
                                          submission.deliverableId,
                                        );
                                        return plagiarismResult
                                          ? getPlagiarismBadge(plagiarismResult.plagiarismPercentage, plagiarismResult)
                                          : null;
                                      })()}
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(new Date(submission.submissionDate).toISOString())}</span>
                                      </div>

                                      {submission.fileName && (
                                        <div className="flex items-center gap-1">
                                          <FileText className="h-3.5 w-3.5" />
                                          <span>
                                            {submission.fileName} ({formatBytes(submission.fileSize)})
                                          </span>
                                        </div>
                                      )}

                                      {isNotEmpty(submission.gitUrl) && (
                                        <div className="flex items-center gap-1">
                                          <GitBranch className="h-3.5 w-3.5" />
                                          <a
                                            href={submission.gitUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            Repository Git
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    {isNotEmpty(submission.gitUrl) && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a
                                          href={submission.gitUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                          Ouvrir Git
                                        </a>
                                      </Button>
                                    )}
                                    {submission.status.toLowerCase() === "pending" && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          void handleAcceptSubmission(submission.submissionId);
                                        }}
                                        disabled={acceptingSubmissions.has(submission.submissionId)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        {acceptingSubmissions.has(submission.submissionId)
                                          ? "Acceptation..."
                                          : "Accepter"}
                                      </Button>
                                    )}
                                    {isNotEmpty(submission.fileName) && submission.error !== true && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          void handleDownloadSubmission(submission.submissionId);
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
