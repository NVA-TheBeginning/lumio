import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Deliverables } from "@prisma-files/client";
import { DeliverablesService } from "@/deliverables/deliverables.service";
import { CreateDeliverableDto, ProjectIdParams, UpdateDeliverableDto } from "@/deliverables/dto/deliverables.dto";

@ApiTags("deliverables")
@Controller()
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post("projects/deliverables")
  @ApiOperation({ summary: "Create a new deliverable for a project" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The deliverable has been successfully created." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  async create(@Body() createDeliverableDto: CreateDeliverableDto): Promise<Deliverables> {
    return this.deliverablesService.create(createDeliverableDto);
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
  async findAll(@Param() params: ProjectIdParams, @Query("promoId") promoId?: number): Promise<Deliverables[]> {
    return this.deliverablesService.findAllByProjectPromo(
      Number(params.projectId),
      promoId ? Number(promoId) : undefined,
    );
  }

  @Put("projects/deliverables")
  @ApiOperation({ summary: "Update a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully updated." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async update(@Body() updateDeliverableDto: UpdateDeliverableDto): Promise<Deliverables> {
    return this.deliverablesService.update(updateDeliverableDto);
  }

  @Delete("projects/deliverables/:id")
  @ApiOperation({ summary: "Delete a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully deleted." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.deliverablesService.remove(id);
  }
}
