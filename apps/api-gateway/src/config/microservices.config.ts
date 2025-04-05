interface MicroserviceInfo {
    name: string;
    url: string;
}

export const microservicesDocs: MicroserviceInfo[] = [
    { name: 'auth', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3002' },
    { name: 'group', url: process.env.GROUP_SERVICE_URL || 'http://localhost:3003' },
    { name: 'deliverable', url: process.env.DELIVERABLE_SERVICE_URL || 'http://localhost:3004' },
    { name: 'report', url: process.env.REPORT_SERVICE_URL || 'http://localhost:3005' },
    { name: 'evaluation', url: process.env.EVALUATION_SERVICE_URL || 'http://localhost:3006' },
    { name: 'notification', url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007' },
    { name: 'plagiarism', url: process.env.PLAGIARISM_SERVICE_URL || 'http://localhost:3008' },
    { name: 'project', url: process.env.PROJECT_SERVICE_URL || 'http://localhost:3009' },
];
