"use client";

import { AlertCircle, Award, Calendar, CheckCircle, Clock, Download, Eye, FileText, Upload, Users } from "lucide-react";
import { DeliverableType } from "@/app/dashboard/teachers/projects/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJoinGroup, useLeaveGroup, useProjectStudent } from "@/hooks/use-project-student";
import { formatDate } from "@/lib/utils";

interface StudentProjectViewProps {
  projectId: number;
  currentUserId: number;
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export default function StudentProjectView({ projectId, currentUserId }: StudentProjectViewProps) {
  const { data: project, isLoading } = useProjectStudent(projectId);
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

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

  const currentUserGroup = project.groups.find((group) => group.members.some((member) => member.id === currentUserId));

  const completedDeliverables = project.submissions?.filter((s) => s.status === "SUBMITTED").length || 0;
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

    const submission = project.submissions?.find(
      (s) => s.groupId === currentUserGroup?.id && s.deliverableId === deliverable.id,
    );

    if (submission?.status === "SUBMITTED") {
      return {
        label: submission.grade ? `Noté (${submission.grade}/20)` : "Soumis",
        variant: (submission.grade ? "default" : "secondary") as BadgeVariant,
        icon: submission.grade ? Award : CheckCircle,
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
              <CardContent className="pt-6">
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
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prochaine échéance</p>
                    <p className="text-2xl font-bold">
                      {project.deliverables.length > 0 && project.deliverables[0]?.deadline
                        ? formatDate(project.deliverables[0].deadline)
                        : "Aucune"}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avancement</p>
                    <p className="text-2xl font-bold">{Math.round(projectProgress)}%</p>
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ressources du projet
              </CardTitle>
              <CardDescription>Téléchargez les documents, templates et ressources du projet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Sujet du projet</p>
                    <p className="text-sm text-muted-foreground">Spécification officielle du projet</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
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
                  const submission = project.submissions?.find(
                    (s) => s.groupId === currentUserGroup?.id && s.deliverableId === deliverable.id,
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
                            {submission?.submittedAt && (
                              <span className="text-sm text-muted-foreground">
                                Soumis le : {formatDate(submission.submittedAt)}
                              </span>
                            )}
                            {submission?.grade && (
                              <Badge variant="outline" className="text-base">
                                Note : {submission.grade}/20
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {submission?.status === "SUBMITTED" ? (
                              <>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir la soumission
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Soumettre à nouveau
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                disabled={!currentUserGroup}
                                variant={currentUserGroup ? "default" : "outline"}
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

                  <div className="grid gap-4">
                    {project.groups.map((group) => {
                      const canJoin = group.members.length < project.groupSettings.maxMembers;
                      const spotsLeft = project.groupSettings.maxMembers - group.members.length;

                      return (
                        <Card key={group.id} className={canJoin ? "border-green-200" : "border-gray-200"}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{group.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant={canJoin ? "default" : "secondary"}>
                                  {group.members.length}/{project.groupSettings.maxMembers}
                                </Badge>
                                <Button
                                  size="sm"
                                  disabled={!canJoin || joinGroupMutation.isPending}
                                  onClick={() => handleJoinGroup(group.id)}
                                >
                                  {canJoin ? `Rejoindre (${spotsLeft} places restantes)` : "Complet"}
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full"
                                >
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-xs">
                                      {member.firstname[0]}
                                      {member.lastname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {member.firstname} {member.lastname}
                                  </span>
                                </div>
                              ))}
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
              {/* Presentations section */}
              <div>
                <h4 className="font-medium mb-3">Soutenances</h4>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune soutenance programmée pour le moment</p>
                </div>
              </div>

              <Separator />

              {/* Grades section */}
              <div>
                <h4 className="font-medium mb-3">Notes et commentaires</h4>
                {project.submissions?.some((s) => s.grade) ? (
                  <div className="space-y-4">
                    {project.submissions
                      .filter((s) => s.grade)
                      .map((submission, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Étape #{index + 1}</p>
                                <p className="text-sm text-muted-foreground">
                                  Soumis le : {submission.submittedAt ? formatDate(submission.submittedAt) : "N/A"}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-lg">
                                {submission.grade}/20
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune note disponible pour le moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
