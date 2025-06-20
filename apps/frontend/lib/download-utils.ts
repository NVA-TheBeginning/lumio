"use client";

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadSubmission(
  submissionId: number,
  getSubmissionDownloadData: (id: number) => Promise<{ blob: Blob; filename: string }>,
): Promise<void> {
  try {
    const { blob, filename } = await getSubmissionDownloadData(submissionId);
    downloadBlobAsFile(blob, filename);
  } catch (error) {
    console.error("Error downloading submission:", error);
    throw error;
  }
}
