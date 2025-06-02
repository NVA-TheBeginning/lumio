"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getReports } from "./actions";

export default function ReportsPage() {
  const {
    data: reports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: () => getReports(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mes Rapports</h1>
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Erreur</h1>
          <p className="text-muted-foreground">Impossible de charger les rapports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mes Rapports</h1>
        <Link href="/reports/editor">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Rapport
          </Button>
        </Link>
      </div>

      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun rapport</h3>
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore créé de rapport. Commencez par en créer un nouveau.
            </p>
            <Link href="/reports/new?projectId=1&groupId=1&promotionId=1">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier rapport
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Rapport #{report.id}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    Projet #{report.projectId}
                  </Badge>
                  {report.groupId && <Badge variant="outline">Groupe #{report.groupId}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {report.sections.length} section{report.sections.length > 1 ? "s" : ""}
                  </p>
                  {report.updatedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Modifié le {formatDate(report.updatedAt.toString())}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Éditer
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
