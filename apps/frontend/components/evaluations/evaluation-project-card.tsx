"use client";

import { BookCheck, BookOpen, Copy, Eye, Users } from "lucide-react";
import type { ProjectWithCriteria } from "@/app/dashboard/teachers/evaluations/actions";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface EvaluationProjectCardProps {
  project: ProjectWithCriteria;
  onCopyFrom?: (project: ProjectWithCriteria) => void;
  onCopyTo?: (project: ProjectWithCriteria) => void;
  showCopyFrom?: boolean;
  showCopyTo?: boolean;
}

export function EvaluationProjectCard({
  project,
  onCopyFrom,
  onCopyTo,
  showCopyFrom = false,
  showCopyTo = false,
}: EvaluationProjectCardProps) {
  const hasCriteria = project.promotions.some((promotion) => promotion.criteria && promotion.criteria.length > 0);
  const totalCriteria = project.promotions.reduce((total, promotion) => total + (promotion.criteria?.length || 0), 0);
  const promotionsWithCriteria = project.promotions.filter(
    (promotion) => promotion.criteria && promotion.criteria.length > 0,
  ).length;

  return (
    <Card
      className={`flex flex-col h-full hover:shadow-md transition-shadow ${
        hasCriteria ? "border-green-200 bg-green-50/30" : "border-gray-200"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
            {hasCriteria ? (
              <BookCheck className="h-5 w-5 text-green-600" />
            ) : (
              <BookOpen className="h-5 w-5 text-gray-400" />
            )}
            {project.name}
          </CardTitle>
        </div>
        <div className="flex justify-between items-center mt-2">
          <CardDescription className="text-sm">{formatDate(project.createdAt)}</CardDescription>
          <Badge variant={hasCriteria ? "default" : "secondary"} className="text-xs">
            {hasCriteria ? `${totalCriteria} critères` : "Aucun critère"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grow pb-3">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {project.promotions.map((promotion) => (
              <Badge
                key={promotion.id}
                variant={promotion.criteria && promotion.criteria.length > 0 ? "default" : "outline"}
                className="text-xs flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                {promotion.name}
                {promotion.criteria && promotion.criteria.length > 0 && (
                  <span className="ml-1">({promotion.criteria.length})</span>
                )}
              </Badge>
            ))}
          </div>

          {hasCriteria && (
            <div className="text-xs text-green-700 bg-green-100 rounded-md p-2">
              <div className="font-medium">
                {promotionsWithCriteria} promotion{promotionsWithCriteria > 1 ? "s" : ""} avec critères
              </div>
              <div className="mt-1 text-green-600">
                Total: {totalCriteria} critère{totalCriteria > 1 ? "s" : ""} de notation
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2 border-t pt-4">
        <div className="flex gap-2">
          <HoverPrefetchLink href={`/dashboard/teachers/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Voir
            </Button>
          </HoverPrefetchLink>
        </div>

        <div className="flex gap-2">
          {showCopyFrom && hasCriteria && onCopyFrom && (
            <Button size="sm" onClick={() => onCopyFrom(project)} className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              Copier depuis
            </Button>
          )}

          {showCopyTo && !hasCriteria && onCopyTo && (
            <Button variant="outline" size="sm" onClick={() => onCopyTo(project)} className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              Copier vers
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
