export default () => ({
  port: 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "defaultSecret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "defaultRefreshSecret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  microservices: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
    project: process.env.PROJECT_SERVICE_URL || "http://localhost:3003",
    deliverable: process.env.DELIVERABLE_SERVICE_URL || "http://localhost:3004",
    report: process.env.REPORT_SERVICE_URL || "http://localhost:3005",
    evaluation: process.env.EVALUATION_SERVICE_URL || "http://localhost:3006",
    notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3007",
    plagiarism: process.env.PLAGIARISM_SERVICE_URL || "http://localhost:3008",
    group: process.env.GROUP_SERVICE_URL || "http://localhost:3009",
  },
});
