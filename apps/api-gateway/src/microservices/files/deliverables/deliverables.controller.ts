import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateDeliverableDto, ProjectIdParams, UpdateDeliverableDto } from "./dto.js";

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
  ): Promise<unknown> {
    const queryParams = [];
    if (startDate) queryParams.push(`startDate=${startDate}`);
    if (endDate) queryParams.push(`endDate=${endDate}`);
    if (projectId) queryParams.push(`projectId=${projectId}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    return this.proxy.forwardRequest("files", `/calendar/promotion/${promotionId}${queryString}`, "GET");
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
