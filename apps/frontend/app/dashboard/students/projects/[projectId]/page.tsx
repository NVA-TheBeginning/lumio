import StudentProjectView from "@/components/student-project-view";
import { getUserFromCookie } from "@/lib/cookie";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function StudentProjectPage({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await getUserFromCookie();
  const projectId = Number.parseInt(resolvedParams.projectId);
  const currentUserId = Number(user?.id);

  return <StudentProjectView projectId={projectId} currentUserId={currentUserId} />;
}
