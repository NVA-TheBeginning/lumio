import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface Submission {
  id: number;
  deliverable?: { name?: string };
  status: string;
  submissionDate: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  data?: Project[];
}

interface ProjectStatistics {
  totalProjects: number;
  activeProjects: number;
  draftProjects: number;
  hiddenProjects: number;
  totalPromotions: number;
  participantProjects?: number;
  groupMemberships?: number;
}

interface ActivityItem {
  id: number;
  type: "submission" | "project_created" | "project_updated" | "deliverable_created";
  title: string;
  description?: string;
  date: string;
  projectName?: string;
  status?: string;
}

@ApiTags("Dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Get("statistics")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get comprehensive dashboard statistics for the current user" })
  @ApiQuery({
    name: "userId",
    type: Number,
    required: true,
    description: "ID de l'utilisateur (validé via gateway)",
  })
  @ApiQuery({
    name: "userRole",
    type: String,
    required: true,
    description: "Rôle de l'utilisateur (TEACHER, ADMIN ou STUDENT)",
  })
  @ApiResponse({
    status: 200,
    description: "User project statistics",
    schema: {
      type: "object",
      properties: {
        totalProjects: { type: "number" },
        activeProjects: { type: "number" },
        draftProjects: { type: "number" },
        hiddenProjects: { type: "number" },
        totalPromotions: { type: "number" },
        participantProjects: { type: "number" },
        groupMemberships: { type: "number" },
      },
    },
  })
  async getStatistics(
    @Query("userId") userId: number,
    @Query("userRole") userRole: "TEACHER" | "ADMIN" | "STUDENT",
  ): Promise<ProjectStatistics> {
    if (!(userId && userRole)) {
      throw new BadRequestException("userId and userRole are required query parameters.");
    }

    return this.proxy.forwardRequest(
      "project",
      `/projects/statistics?userId=${userId}&userRole=${userRole}`,
      "GET",
    ) as Promise<ProjectStatistics>;
  }

  @Get("activity")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get recent activity for the current user" })
  @ApiQuery({
    name: "userId",
    type: Number,
    required: true,
    description: "ID de l'utilisateur (validé via gateway)",
  })
  @ApiQuery({
    name: "userRole",
    type: String,
    required: true,
    description: "Rôle de l'utilisateur (TEACHER, ADMIN ou STUDENT)",
  })
  @ApiQuery({
    name: "limit",
    type: Number,
    required: false,
    description: "Number of recent activities to return (default: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "Recent user activity",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          type: { type: "string", enum: ["submission", "project_created", "project_updated", "deliverable_created"] },
          title: { type: "string" },
          description: { type: "string" },
          date: { type: "string" },
          projectName: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  })
  async getRecentActivity(
    @Query("userId") userId: number,
    @Query("userRole") userRole: "TEACHER" | "ADMIN" | "STUDENT",
    @Query("limit") limit = 10,
  ): Promise<ActivityItem[]> {
    if (!(userId && userRole)) {
      throw new BadRequestException("userId and userRole are required query parameters.");
    }

    const activities: ActivityItem[] = [];

    try {
      if (userRole === "STUDENT") {
        const submissions = (await this.proxy.forwardRequest(
          "files",
          `/deliverables/${userId}/submissions?limit=${Math.ceil(limit / 2)}`,
          "GET",
        )) as Submission[];

        submissions?.forEach((submission: Submission) => {
          activities.push({
            id: submission.id,
            type: "submission",
            title: `Soumission pour ${submission.deliverable?.name || "livrable"}`,
            description:
              submission.status === "ACCEPTED" ? "Acceptée" : submission.status === "LATE" ? "En retard" : "En attente",
            date: submission.submissionDate,
            status: submission.status,
          });
        });
      }

      const recentProjects = (await this.proxy.forwardRequest(
        "project",
        `/projects/myprojects?userId=${userId}&userRole=${userRole}&page=1&size=${Math.ceil(limit / 2)}`,
        "GET",
      )) as ProjectsResponse;

      recentProjects?.data?.forEach((project: Project) => {
        activities.push({
          id: project.id,
          type: project.createdAt === project.updatedAt ? "project_created" : "project_updated",
          title:
            project.createdAt === project.updatedAt
              ? `Projet créé: ${project.name}`
              : `Projet mis à jour: ${project.name}`,
          description: project.description,
          date: project.updatedAt,
          projectName: project.name,
        });
      });

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching activity data:", error);
      return [];
    }
  }
}
