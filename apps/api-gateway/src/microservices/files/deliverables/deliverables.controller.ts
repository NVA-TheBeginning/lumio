import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CalendarResponseDto, CreateDeliverableDto, ProjectIdParams, UpdateDeliverableDto } from "./dto.js";

interface DeliverableResponse {
  id: number;
  projectId: number;
  promotionId: number;
  name: string;
  description?: string;
  deadline: string;
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number;
  type: string[];
  createdAt: string;
}

interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface PromotionResponse {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
}

@ApiTags("deliverables")
@Controller()
export class DeliverablesController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("projects/deliverables")
  @ApiOperation({ summary: "Create a new deliverable for a project" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The deliverable has been successfully created." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  async create(@Body() createDeliverableDto: CreateDeliverableDto): Promise<unknown> {
    return this.proxy.forwardRequest("files", "/projects/deliverables", "POST", createDeliverableDto);
  }

  @Get("projects/:projectId/deliverables")
  @ApiOperation({ summary: "Get all deliverables for a project" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns all deliverables for the project." })
  @ApiQuery({
    name: "promoId",
    required: false,
    type: Number,
    description: "Filter deliverables by promotion ID",
  })
  async findAll(@Param() params: ProjectIdParams, @Query("promoId") promoId?: string): Promise<unknown> {
    const queryString = promoId ? `?promoId=${promoId}` : "";
    return this.proxy.forwardRequest("files", `/projects/${params.projectId}/deliverables${queryString}`, "GET");
  }

  @Get("calendar/promotion/:promotionId")
  @ApiOperation({ summary: "Get calendar deliverables for a promotion" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns deliverables for the promotion within the specified date range.",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date for filtering (ISO 8601 format)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date for filtering (ISO 8601 format)",
  })
  @ApiQuery({
    name: "projectId",
    required: false,
    type: Number,
    description: "Filter by specific project ID",
  })
  async getCalendarDeliverables(
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("projectId") projectId?: string,
  ): Promise<CalendarResponseDto> {
    const queryParams = [];
    if (startDate) queryParams.push(`startDate=${startDate}`);
    if (endDate) queryParams.push(`endDate=${endDate}`);
    if (projectId) queryParams.push(`projectId=${projectId}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    const deliverables = await this.proxy.forwardRequest<DeliverableResponse[]>(
      "files",
      `/calendar/promotion/${promotionId}${queryString}`,
      "GET",
    );

    if (deliverables.length === 0) {
      return {
        promotionId,
        promotionName: "",
        projects: [],
      };
    }

    const uniqueProjectIds = [...new Set(deliverables.map((d) => d.projectId))];

    const promotion = await this.proxy.forwardRequest<PromotionResponse>(
      "project",
      `/promotions/${promotionId}`,
      "GET",
    );

    const allProjects = await this.proxy.forwardRequest<ProjectResponse[]>("project", "/projects", "GET");

    const projectPromises = uniqueProjectIds.map(async (projectId) => {
      const project = allProjects.find((p) => p.id === projectId);
      if (!project) {
        return null;
      }

      const projectDeliverables = deliverables.filter((d) => d.projectId === projectId);

      return {
        projectId: project.id,
        projectName: project.name,
        projectDescription: project.description,
        deliverables: projectDeliverables,
      };
    });

    const projectResults = await Promise.all(projectPromises);
    const projects = projectResults.filter((project): project is NonNullable<typeof project> => project !== null);

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      projects,
    };
  }

  @Put("projects/deliverables")
  @ApiOperation({ summary: "Update a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully updated." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async update(@Body() updateDeliverableDto: UpdateDeliverableDto): Promise<unknown> {
    return this.proxy.forwardRequest("files", "/projects/deliverables", "PUT", updateDeliverableDto);
  }

  @Delete("projects/deliverables/:id")
  @ApiOperation({ summary: "Delete a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully deleted." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.proxy.forwardRequest("files", `/projects/deliverables/${id}`, "DELETE");
  }
}
