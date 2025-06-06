"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { ProjectHeader } from "@/components/projects/header";
import { ProjectTabs } from "@/components/projects/tabs";
import { getProjectByIdTeacher, type ProjectType } from "../actions";

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: ProjectData, isLoading } = useQuery<ProjectType>({
    queryKey: ["projects", Number(projectId)],
    queryFn: () => getProjectByIdTeacher(Number(projectId)),
  });

  if (isLoading || !ProjectData) {
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

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader project={ProjectData} router={router} />
      <ProjectTabs project={ProjectData} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
