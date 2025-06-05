"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { getProjectByIdStudent, ProjectStudentType } from "@/app/dashboard/teachers/projects/actions";

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: number }> }) {
  const { projectId } = use(params);
  //   const router = useRouter();
  //   const [activeTab, setActiveTab] = useState("overview");

  const { data: ProjectData, isLoading } = useQuery<ProjectStudentType>({
    queryKey: ["projects", Number(projectId)],
    queryFn: () => getProjectByIdStudent(Number(projectId)),
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
    <div className="min-h-screen bg-background p-4">
      {" "}
      <pre className="whitespace-pre-wrap break-words bg-gray-100 p-4 rounded-md text-sm">
        {JSON.stringify(ProjectData, null, 2)}
      </pre>
    </div>
  );
}
