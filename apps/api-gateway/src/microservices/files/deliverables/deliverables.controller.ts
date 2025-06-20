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
