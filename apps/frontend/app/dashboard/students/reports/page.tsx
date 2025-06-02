"use client";

import ReportEditor from "@/components/report-editor";

export default function NewReportPage() {
  const projectId = 1;
  const groupId = 1;
  const promotionId = 1;

  return <ReportEditor projectId={projectId} groupId={groupId} promotionId={promotionId} />;
}
