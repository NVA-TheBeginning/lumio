"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import ReportEditor from "@/components/report-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getReports } from "./actions";

type ViewMode = "list" | "editor" | "new";

export default function ReportsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => getReports(),
  });

  const handleEditReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setViewMode("editor");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedReportId(null);
  };

  if (viewMode === "editor" && selectedReportId !== null) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux rapports
          </Button>
        </div>
        <ReportEditor reportId={selectedReportId} />
      </div>
    );
  }

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Rapports</h1>
      </div>

      {reports && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Rapport #{report.id}
                </CardTitle>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleEditReport(report.id);
                      }}
                    >
                      Éditer
                    </Button>
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
