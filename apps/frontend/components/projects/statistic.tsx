"use client";

import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
import { Progress } from "@/components//ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectStatisticsProps {
  project: ProjectType;
}

export function ProjectStatistics({ project }: ProjectStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Statistiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-2xl font-bold">
              {project.promotions.reduce((total, promo) => total + promo.groups.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Groupes</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-2xl font-bold">
              {project.promotions.reduce(
                (total, promo) =>
                  total + promo.groups.reduce((groupTotal, group) => groupTotal + group.members.length, 0),
                0,
              )}
            </p>
            <p className="text-sm text-muted-foreground">Étudiants</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{project.deliverables.length}</p>
            <p className="text-sm text-muted-foreground">Livrables</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-2xl font-bold">
              {project.deliverables.reduce(
                (total, deliverable) => total + deliverable.submissions.filter((s) => s.grade !== null).length,
                0,
              )}
            </p>
            <p className="text-sm text-muted-foreground">Évaluations</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Progression des groupes</span>
              <span className="text-sm text-muted-foreground">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Livrables soumis</span>
              <span className="text-sm text-muted-foreground">50%</span>
            </div>
            <Progress value={50} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Évaluations complétées</span>
              <span className="text-sm text-muted-foreground">30%</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
