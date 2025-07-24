"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Info,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadProjectDocument, SubmissionMetadataResponse } from "@/app/dashboard/students/projects/actions";
import { DeliverableType, getOrders } from "@/app/dashboard/teachers/projects/actions";
import { SubmissionDetailsDialog } from "@/components/students/submission-details-dialog";
import { SubmissionDialog } from "@/components/students/submission-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeliverableRules,
  useJoinGroup,
  useLeaveGroup,
  useProjectStudent,
  useStudentEvaluations,
} from "@/hooks/use-project-student";
import { useStudentPresentationOrder } from "@/hooks/use-student-presentations";
import { useSubmissions } from "@/hooks/use-submissions";
import { exportPresentationOrdersToPDF } from "@/lib/pdf-export";
import { formatDate, formatDateTime, isNotNull, isValidNumber } from "@/lib/utils";
import { type DeliverableRule, RuleType } from "@/types/rules";

interface StudentProjectViewProps {
  projectId: number;
  currentUserId: number;
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type DialogSubmission = {
  submissionId: number;
  deliverableId: number;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  submissionDate: Date;
  groupId: number;
  penalty: number;
  type: string[];
  status: string;
  lastModified: Date;
  gitUrl?: string;
  error?: boolean;
};

export default function StudentProjectView({ projectId, currentUserId }: StudentProjectViewProps) {
  const { data: project, isLoading, refetch } = useProjectStudent(projectId);
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  const downloadDocumentMutation = useMutation({
    mutationFn: async ({ documentId, filename }: { documentId: number; filename: string }) => {
      const result = await downloadProjectDocument(documentId);
      return { ...result, filename };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document téléchargé");
    },
    onError: (error) => {
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    },
  });

  const currentUserGroup = project?.groups.find((group) => group.members.some((member) => member.id === currentUserId));

  const { data: submissions, refetch: refetchSubmissions } = useSubmissions(
    currentUserGroup?.id ?? 0,
    undefined,
    !!currentUserGroup,
  );

  const { data: presentationOrders } = useStudentPresentationOrder(
    projectId,
    project?.promotionId ?? 0,
    currentUserGroup?.id ?? 0,
  );

  const { data: evaluations } = useStudentEvaluations(projectId, !!project && !!currentUserGroup);

  const finalGrades = evaluations?.finalGrades;
  const criteriaWithGrades = evaluations?.criteriaWithGrades;

  const [submissionDialog, setSubmissionDialog] = useState<{
    open: boolean;
    deliverable: DeliverableType | null;
  }>({ open: false, deliverable: null });

  const [submissionDetailsDialog, setSubmissionDetailsDialog] = useState<{
    open: boolean;
    submission: DialogSubmission | null;
    deliverable: DeliverableType | null;
  }>({ open: false, submission: null, deliverable: null });

  const [rulesDialog, setRulesDialog] = useState<{
    open: boolean;
    deliverable: DeliverableType | null;
  }>({ open: false, deliverable: null });

  const handleOpenSubmissionDialog = (deliverable: DeliverableType) => {
    setSubmissionDialog({ open: true, deliverable });
  };

  const handleCloseSubmissionDialog = () => {
    setSubmissionDialog({ open: false, deliverable: null });
  };

  const handleOpenSubmissionDetailsDialog = (submission: SubmissionMetadataResponse, deliverable: DeliverableType) => {
    const dialogSubmission: DialogSubmission = {
      submissionId: submission.submissionId,
      deliverableId: submission.deliverableId,
      fileKey: submission.fileKey,
      fileName: submission.fileName,
      mimeType: submission.mimeType,
      fileSize: submission.fileSize,
      submissionDate: new Date(submission.submissionDate),
      groupId: submission.groupId,
      penalty: submission.penalty,
      type: submission.type,
      status: submission.status,
      lastModified: new Date(submission.lastModified),
      gitUrl: submission.gitUrl ?? "",
      error: submission.error,
    };

    setSubmissionDetailsDialog({
      open: true,
      submission: dialogSubmission,
      deliverable,
    });
  };

  const handleCloseSubmissionDetailsDialog = () => {
    setSubmissionDetailsDialog({ open: false, submission: null, deliverable: null });
  };

  const handleOpenRulesDialog = (deliverable: DeliverableType) => {
    setRulesDialog({ open: true, deliverable });
  };

  const handleCloseRulesDialog = () => {
    setRulesDialog({ open: false, deliverable: null });
  };

  const handleSubmissionSuccess = async () => {
    handleCloseSubmissionDialog();
    await refetch();
    await refetchSubmissions();
  };

  const handleSubmissionDeleted = async () => {
    handleCloseSubmissionDetailsDialog();
    await refetch();
    await refetchSubmissions();
  };

  if (isLoading || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement du projet...</p>
          </div>
        </div>
      </div>
    );
  }

  const completedDeliverables = submissions?.length ?? 0;
  const totalDeliverables = project.deliverables.length;
  const projectProgress = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0;

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate({ groupId, studentIds: [currentUserId] });
  };

  const handleLeaveGroup = (groupId: number) => {
    leaveGroupMutation.mutate({ groupId, userId: currentUserId });
  };

  const getDeliverableStatus = (deliverable: DeliverableType) => {
    const now = new Date();
    const deadlineDate = new Date(deliverable.deadline);
    const isOverdue = now > deadlineDate;
    const isUpcoming = deadlineDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

    const submission = submissions?.find(
      (s) => s.deliverableId === deliverable.id && s.groupId === currentUserGroup?.id,
    );

    if (submission) {
      return {
        label: "Soumis",
        variant: "secondary" as BadgeVariant,
        icon: CheckCircle,
      };
    }
    if (isOverdue) return { label: "En retard", variant: "destructive" as BadgeVariant, icon: AlertCircle };
    if (isUpcoming) return { label: "Échéance proche", variant: "secondary" as BadgeVariant, icon: Clock };
    return { label: "À venir", variant: "default" as BadgeVariant, icon: Calendar };
  };

  const getGroupDeadlineStatus = () => {
    if (!project.groupSettings.deadline) return null;
    const deadline = new Date(project.groupSettings.deadline);
    const now = new Date();
    const isOverdue = now > deadline;
    const daysLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return { isOverdue, daysLeft, deadline };
  };

  const groupDeadlineStatus = getGroupDeadlineStatus();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const renderRuleDetails = (rule: DeliverableRule) => {
    let parsedDetails: DeliverableRule["ruleDetails"];
    try {
      parsedDetails = typeof rule.ruleDetails === "string" ? JSON.parse(rule.ruleDetails) : rule.ruleDetails;
    } catch (error) {
      console.error("Error parsing rule details:", error);
      return <div className="text-sm text-muted-foreground italic">Erreur lors du parsing des détails de la règle</div>;
    }

    switch (rule.ruleType) {
      case RuleType.SIZE_LIMIT: {
        const sizeDetails = parsedDetails as { maxSizeInBytes: number };
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Taille maximale autorisée :</span>
            </div>
            <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {formatFileSize(sizeDetails.maxSizeInBytes)}
            </div>
          </div>
        );
      }
      case RuleType.FILE_PRESENCE: {
        const fileDetails = parsedDetails as {
          requiredFiles?: string[];
          allowedExtensions?: string[];
          forbiddenExtensions?: string[];
        };
        return (
          <div className="space-y-3">
            {(fileDetails.requiredFiles?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Fichiers obligatoires :</div>
                <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {fileDetails.requiredFiles?.join(", ")}
                </div>
              </div>
            )}
            {(fileDetails.allowedExtensions?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Extensions autorisées :</div>
                <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {fileDetails.allowedExtensions?.join(", ")}
                </div>
              </div>
            )}
            {(fileDetails.forbiddenExtensions?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Extensions interdites :</div>
                <div className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950 p-2 rounded border border-red-200 dark:border-red-800">
                  {fileDetails.forbiddenExtensions?.join(", ")}
                </div>
              </div>
            )}
            {(fileDetails.requiredFiles?.length ?? 0) === 0 &&
              (fileDetails.allowedExtensions?.length ?? 0) === 0 &&
              (fileDetails.forbiddenExtensions?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground italic">
                  Aucune restriction spécifique sur les fichiers
                </div>
              )}
          </div>
        );
      }
      case RuleType.DIRECTORY_STRUCTURE: {
        const dirDetails = parsedDetails as {
          requiredDirectories?: string[];
          forbiddenDirectories?: string[];
        };
        return (
          <div className="space-y-3">
            {(dirDetails.requiredDirectories?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Dossiers obligatoires :</div>
                <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {dirDetails.requiredDirectories?.join(", ")}
                </div>
              </div>
            )}
            {(dirDetails.forbiddenDirectories?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Dossiers interdits :</div>
                <div className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950 p-2 rounded border border-red-200 dark:border-red-800">
                  {dirDetails.forbiddenDirectories?.join(", ")}
                </div>
              </div>
            )}
            {(dirDetails.requiredDirectories?.length ?? 0) === 0 &&
              (dirDetails.forbiddenDirectories?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground italic">
                  Aucune restriction spécifique sur la structure des dossiers
                </div>
              )}
          </div>
        );
      }
      default:
        return <div className="text-sm text-muted-foreground italic">Type de règle non reconnu : {rule.ruleType}</div>;
    }
  };

  const DeliverableRulesModal = ({ deliverable }: { deliverable: DeliverableType }) => {
    const { data: rules, isLoading } = useDeliverableRules(deliverable.id);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    console.log("Deliverable Rules:", rules);

    if (!rules || rules.length === 0) {
      return (
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune règle spécifique n'a été définie pour ce livrable.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Informations générales</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                <strong>Nom :</strong> {deliverable.name}
              </p>
              <p>
                <strong>Description :</strong> {deliverable.description}
              </p>
              <p>
                <strong>Date d'échéance :</strong> {formatDate(deliverable.deadline)}
              </p>
              {deliverable.allowLateSubmission && (
                <p>
                  <strong>Soumission tardive :</strong> Autorisée avec pénalité de {deliverable.lateSubmissionPenalty}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Règles de soumission
          </h4>

          {rules.map((rule, index) => (
            <div key={rule.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <h5 className="font-medium">
                  {rule.ruleType === RuleType.SIZE_LIMIT && "Limite de taille"}
                  {rule.ruleType === RuleType.FILE_PRESENCE && "Présence de fichiers"}
                  {rule.ruleType === RuleType.DIRECTORY_STRUCTURE && "Structure de dossiers"}
                </h5>
              </div>
              <div className="ml-8">{renderRuleDetails(rule)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleExportPDF = async () => {
    if (!(isValidNumber(presentationOrders?.length) && presentationOrders.length > 0 && isNotNull(currentUserGroup)))
      return;

    const presentationOrder = presentationOrders[0];
    if (!presentationOrder?.order) return;

    const { presentation } = presentationOrder;

    try {
      const allOrders = await getOrders(presentation.id);

      const ordersWithGroups = allOrders
        .map((order) => ({
          ...order,
          group: project.groups.find((group) => group.id === order.groupId),
        }))
        .filter((order) => order.group);

      const promotionData = {
        id: project.promotionId,
        name: "Promotion",
        description: "",
        status: "VISIBLE" as const,
        groupSettings: {
          projectId: project.id,
          promotionId: project.promotionId,
          minMembers: project.groupSettings.minMembers,
          maxMembers: project.groupSettings.maxMembers,
          mode: project.groupSettings.mode,
          deadline: project.groupSettings.deadline,
          updatedAt: new Date().toISOString(),
        },
        groups: project.groups,
      };

      await exportPresentationOrdersToPDF({
        presentation,
        promotion: promotionData,
        orders: ordersWithGroups,
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{project.name}</CardTitle>
              <CardDescription className="text-base">{project.description}</CardDescription>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progression :</span>
                <Badge variant="outline">
                  {completedDeliverables}/{totalDeliverables}
                </Badge>
              </div>
              <Progress value={projectProgress} className="w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>
      {!currentUserGroup && groupDeadlineStatus && (
        <Alert variant={groupDeadlineStatus.isOverdue ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {groupDeadlineStatus.isOverdue
              ? "La date limite de formation des groupes est passée. Contactez votre instructeur si vous avez besoin d'aide."
              : `Date limite de formation des groupes : ${formatDate(project.groupSettings.deadline)} (${groupDeadlineStatus.daysLeft} jours restants)`}
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="groups">Groupes</TabsTrigger>
          <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Votre groupe</p>
                    <p className="text-2xl font-bold">{currentUserGroup ? currentUserGroup.name : "Non assigné"}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prochaine échéance</p>
                    <p className="text-2xl font-bold">
                      {project.deliverables.length > 0 && isNotNull(project.deliverables[0]?.deadline)
                        ? formatDate(project.deliverables[0].deadline)
                        : "Aucune"}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prochaine soutenance</p>
                    <p className="text-2xl font-bold">
                      {isValidNumber(presentationOrders?.length) &&
                      presentationOrders.length > 0 &&
                      isNotNull(presentationOrders[0]?.order?.scheduledDatetime)
                        ? formatDate(presentationOrders[0].order.scheduledDatetime)
                        : "Soutenance non programmée"}
                    </p>
                    {isValidNumber(presentationOrders?.length) &&
                      presentationOrders.length > 0 &&
                      isNotNull(presentationOrders[0]?.order) && (
                        <p className="text-sm text-muted-foreground">
                          Position #{presentationOrders[0].order.orderNumber}
                        </p>
                      )}
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Étapes du projet
                </CardTitle>
                <CardDescription>Gérez vos soumissions et suivez votre progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.deliverables.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune étape n'a encore été publiée</p>
                  </div>
                ) : (
                  project.deliverables.map((deliverable) => {
                    const status = getDeliverableStatus(deliverable);
                    const StatusIcon = status.icon;
                    const submission = submissions?.find(
                      (s) => s.deliverableId === deliverable.id && s.groupId === currentUserGroup?.id,
                    );

                    return (
                      <Card key={deliverable.id} className="relative">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">{deliverable.name}</h4>
                                <Badge variant={status.variant} className="flex items-center gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{deliverable.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Échéance : {formatDate(deliverable.deadline)}
                                </div>
                                {deliverable.allowLateSubmission && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Soumission tardive autorisée (pénalité de {deliverable.lateSubmissionPenalty}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {submission?.submissionDate && (
                                <span className="text-sm text-muted-foreground">
                                  Soumis le : {formatDate(submission.submissionDate.toString())}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenRulesDialog(deliverable)}>
                                <Info className="h-4 w-4 mr-2" />
                                Voir les règles
                              </Button>
                              {submission ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenSubmissionDetailsDialog(submission, deliverable)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir la soumission
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenSubmissionDialog(deliverable)}
                                    disabled={!currentUserGroup}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Soumettre à nouveau
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!currentUserGroup}
                                  variant={currentUserGroup ? "default" : "outline"}
                                  onClick={() => handleOpenSubmissionDialog(deliverable)}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {currentUserGroup ? "Soumettre" : "Rejoignez un groupe pour soumettre"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5" />
                    Ressources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.documents.length > 0 ? (
                    project.documents.map((document) => (
                      <div
                        key={document.id}
                        className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{document.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(document.sizeInBytes / 1024)} KB • Ajouté le {formatDate(document.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            downloadDocumentMutation.mutate({ documentId: document.id, filename: document.name })
                          }
                          disabled={downloadDocumentMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun document disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {currentUserGroup && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-5 w-5" />
                      Membres du groupe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentUserGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.firstname[0]}
                            {member.lastname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {member.firstname} {member.lastname}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {member.id === currentUserId && (
                          <Badge variant="secondary" className="text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des groupes
              </CardTitle>
              <CardDescription>
                Taille de groupe : {project.groupSettings.minMembers}-{project.groupSettings.maxMembers} membres
                {project.groupSettings.deadline && (
                  <span className="block mt-1">
                    Date limite de formation : {formatDate(project.groupSettings.deadline)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUserGroup && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Votre groupe : {currentUserGroup.name}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveGroup(currentUserGroup.id)}
                      disabled={leaveGroupMutation.isPending}
                    >
                      Quitter le groupe
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentUserGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.firstname[0]}
                            {member.lastname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {member.firstname} {member.lastname}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        {member.id === currentUserId && <Badge variant="secondary">Vous</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!currentUserGroup && (
                <div className="space-y-4">
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Vous n'êtes pas encore dans un groupe. Rejoignez-en un ci-dessous ou attendez une invitation.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.groups.map((group) => {
                      const canJoin = group.members.length < project.groupSettings.maxMembers;

                      return (
                        <Card key={group.id} className="border-gray-200 h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{group.name}</h4>
                              <Badge variant={canJoin ? "default" : "secondary"} className="text-xs">
                                {group.members.length}/{project.groupSettings.maxMembers}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {group.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
                                >
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">
                                      {member.firstname[0]}
                                      {member.lastname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">
                                    {member.firstname} {member.lastname}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3"
                                disabled={!canJoin || joinGroupMutation.isPending}
                                onClick={() => handleJoinGroup(group.id)}
                              >
                                {canJoin ? "Rejoindre" : "Complet"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Évaluations et notes
              </CardTitle>
              <CardDescription>Consultez vos notes, commentaires et soutenances à venir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Soutenances</h4>
                  {isValidNumber(presentationOrders?.length) &&
                    presentationOrders.length > 0 &&
                    isNotNull(currentUserGroup) && (
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter PDF
                      </Button>
                    )}
                </div>
                {isValidNumber(presentationOrders?.length) && presentationOrders.length > 0 ? (
                  <div className="space-y-4">
                    {presentationOrders.map(({ presentation, order }) => (
                      <Card key={presentation.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">Soutenance #{order?.orderNumber}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(presentation.startDatetime)}
                                </p>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {presentation.durationPerGroup}min
                              </Badge>
                            </div>
                            {isNotNull(order?.scheduledDatetime) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Horaire programmé :</span>
                                <span>{formatDateTime(order.scheduledDatetime)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                Passage en{" "}
                                {isNotNull(order?.orderNumber) && isValidNumber(order.orderNumber)
                                  ? `${order.orderNumber}${order.orderNumber === 1 ? "er" : "ème"}`
                                  : "position"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune soutenance programmée pour le moment</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Évaluations</h4>

                {/* Final Grade Section */}
                {finalGrades && finalGrades.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {finalGrades.map((finalGrade) => (
                      <Card key={finalGrade.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-lg">Note finale du projet</p>
                              <p className="text-sm text-muted-foreground">
                                Évalué le : {formatDate(finalGrade.createdAt)}
                              </p>
                              {finalGrade.comment && (
                                <p className="text-sm text-muted-foreground mt-1">{finalGrade.comment}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-2xl px-4 py-2">
                              {finalGrade.finalGrade}/20
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune note finale disponible pour le moment</p>
                  </div>
                )}

                {/* Detailed Criteria Breakdown */}
                {criteriaWithGrades && criteriaWithGrades.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <h5 className="font-medium text-base">Détail des évaluations par critère</h5>
                    <div className="space-y-3">
                      {criteriaWithGrades.map((criteria) => (
                        <Card key={criteria.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h6 className="font-medium">{criteria.name}</h6>
                                    <Badge variant="secondary" className="text-xs">
                                      {criteria.type === "DELIVERABLE" && "Livrable"}
                                      {criteria.type === "REPORT" && "Rapport"}
                                      {criteria.type === "PRESENTATION" && "Présentation"}
                                    </Badge>
                                    {criteria.individual && (
                                      <Badge variant="outline" className="text-xs">
                                        Individuel
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Coefficient : {criteria.weight}</p>
                                </div>
                                <div className="text-right">
                                  {criteria.studentGrade ? (
                                    <div>
                                      <Badge variant="outline" className="text-lg px-3 py-1">
                                        {criteria.studentGrade.gradeValue}/{(criteria.weight / 100) * 20}

                                      </Badge>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Évalué le : {formatDate(criteria.studentGrade.gradedAt)}
                                      </p>
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="text-sm">
                                      Non évalué
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {criteria.studentGrade?.comment && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Commentaire :</p>
                                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    {criteria.studentGrade.comment}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {submissionDialog.deliverable && currentUserGroup && (
        <SubmissionDialog
          open={submissionDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseSubmissionDialog();
            }
          }}
          deliverable={submissionDialog.deliverable}
          groupId={currentUserGroup.id}
          onSuccess={handleSubmissionSuccess}
        />
      )}
      {submissionDetailsDialog.submission && submissionDetailsDialog.deliverable && (
        <SubmissionDetailsDialog
          open={submissionDetailsDialog.open}
          onOpenChange={handleCloseSubmissionDetailsDialog}
          submission={submissionDetailsDialog.submission}
          deliverable={submissionDetailsDialog.deliverable}
          onSuccess={handleSubmissionDeleted}
        />
      )}
      {rulesDialog.deliverable && (
        <Dialog open={rulesDialog.open} onOpenChange={handleCloseRulesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Règles du livrable : {rulesDialog.deliverable.name}
              </DialogTitle>
            </DialogHeader>
            <DeliverableRulesModal deliverable={rulesDialog.deliverable} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
