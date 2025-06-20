"use client";

import { ProjectType } from "@/app/dashboard/teachers/projects/actions";
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
        </div>
      </CardContent>
    </Card>
  );
}
