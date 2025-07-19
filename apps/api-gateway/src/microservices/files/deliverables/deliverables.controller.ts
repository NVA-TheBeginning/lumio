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
    const queryString = promoId != null && promoId !== "" ? `?promoId=${promoId}` : "";
    return this.proxy.forwardRequest("files", `/projects/${params.projectId}/deliverables${queryString}`, "GET");
  }

  @Get("calendar")
  @ApiOperation({ summary: "Get calendar deliverables for a promotion or all promotions" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns deliverables for the promotion(s) within the specified date range.",
  })
  @ApiQuery({
    name: "promotionId",
    required: false,
    type: Number,
    description: "Filter by specific promotion ID",
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
    @Query("promotionId") promotionId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("projectId") projectId?: string,
  ): Promise<CalendarResponseDto[]> {
    const queryParams = [
      promotionId != null && promotionId !== "" ? `promotionId=${promotionId}` : null,
      startDate != null && startDate !== "" ? `startDate=${startDate}` : null,
      endDate != null && endDate !== "" ? `endDate=${endDate}` : null,
      projectId != null && projectId !== "" ? `projectId=${projectId}` : null,
    ].filter((param): param is string => param !== null);
    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    const deliverables = await this.proxy.forwardRequest<DeliverableResponse[]>(
      "files",
      promotionId != null && promotionId !== ""
        ? `/calendar/promotion/${promotionId}${queryString}`
        : `/calendar${queryString}`,
      "GET",
    );

    if (deliverables.length === 0) {
      return [];
    }

    const [allPromotions, allProjects] = await Promise.all([
      this.proxy.forwardRequest<PromotionResponse[]>("project", "/promotions", "GET"),
      this.proxy.forwardRequest<ProjectResponse[]>("project", "/projects", "GET"),
    ]);

    const projectMap = new Map(allProjects.map((p) => [p.id, p]));
    const promotionMap = new Map(allPromotions.map((p) => [p.id, p]));

    const buildProjects = (deliverables: DeliverableResponse[]) => {
      const projectGroups = new Map<number, DeliverableResponse[]>();
      deliverables.forEach((d) => {
        if (!projectGroups.has(d.projectId)) {
          projectGroups.set(d.projectId, []);
        }
        const group = projectGroups.get(d.projectId);
        if (group) {
          group.push(d);
        }
      });

      return Array.from(projectGroups.entries())
        .map(([projectId, deliverables]) => {
          const project = projectMap.get(projectId);
          return project
            ? {
                projectId: project.id,
                projectName: project.name,
                projectDescription: project.description,
                deliverables,
              }
            : null;
        })
        .filter((project): project is NonNullable<typeof project> => project !== null);
    };

    if (promotionId != null && promotionId !== "" && !Number.isNaN(Number(promotionId))) {
      const promotion = promotionMap.get(Number(promotionId));
      if (!promotion) {
        return [];
      }
      return [
        {
          promotionId: promotion.id,
          promotionName: promotion.name,
          projects: buildProjects(deliverables),
        },
      ];
    }

    const promotionGroups = new Map<number, DeliverableResponse[]>();
    deliverables.forEach((d) => {
      if (!promotionGroups.has(d.promotionId)) {
        promotionGroups.set(d.promotionId, []);
      }
      const group = promotionGroups.get(d.promotionId);
      if (group) {
        group.push(d);
      }
    });

    return Array.from(promotionGroups.entries())
      .map(([promotionId, deliverables]) => {
        const promotion = promotionMap.get(promotionId);
        if (!promotion) return null;
        return {
          promotionId: promotion.id,
          promotionName: promotion.name,
          projects: buildProjects(deliverables),
        };
      })
      .filter((promotion): promotion is NonNullable<typeof promotion> => promotion !== null);
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
