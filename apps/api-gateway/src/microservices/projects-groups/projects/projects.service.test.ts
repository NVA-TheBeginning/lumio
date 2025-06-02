"use client"

import ReportEditor from "@/components/report-editor"

export default function NewReportPage() {
  const projectId = 1
  let groupId = 1
  let promotionId = 1

  return <ReportEditor projectId={projectId} groupId={groupId} promotionId={promotionId} />
}
