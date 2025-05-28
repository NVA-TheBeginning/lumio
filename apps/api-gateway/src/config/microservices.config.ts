interface MicroserviceInfo {
  name: string;
  url: string;
}

export const microservicesDocs: MicroserviceInfo[] = [
  { name: "auth", url: process.env.AUTH_SERVICE_URL || "http://localhost:3002" },
  { name: "project", url: process.env.PROJECT_SERVICE_URL || "http://localhost:3003" },
  { name: "files", url: process.env.FILES_SERVICE_URL || "http://localhost:3004" },
  { name: "report", url: process.env.REPORT_SERVICE_URL || "http://localhost:3005" },
  { name: "evaluation", url: process.env.EVALUATION_SERVICE_URL || "http://localhost:3006" },
  { name: "notif", url: process.env.NOTIF_SERVICE_URL || "http://localhost:3007" },
  { name: "plagiarism", url: process.env.PLAGIARISM_SERVICE_URL || "http://localhost:3008" },
];
