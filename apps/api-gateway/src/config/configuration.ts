export default () => ({
  port: 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  microservices: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
    project: process.env.PROJECT_SERVICE_URL || "http://localhost:3003",
    files: process.env.FILES_SERVICE_URL || "http://localhost:3004",
    report: process.env.REPORT_SERVICE_URL || "http://localhost:3005",
    evaluation: process.env.EVALUATION_SERVICE_URL || "http://localhost:3006",
    notif: process.env.NOTIF_SERVICE_URL || "http://localhost:3007",
    plagiarism: process.env.PLAGIARISM_SERVICE_URL || "http://localhost:3008",
  },
});
