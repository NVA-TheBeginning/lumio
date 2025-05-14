import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from "@nestjs/swagger";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto, UpdateProjectStatusDto } from "./dto/update-project.dto";
import {ProjectsByPromotion, ProjectService} from "./projects.service";

@ApiTags("projects")
@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project with group settings for each promotion" })
  @ApiResponse({ status: 201, description: "Project successfully created." })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get("creator/:creatorId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve all projects created by a specific user" })
  @ApiParam({ name: "creatorId", description: "Creator user ID", type: Number })
  @ApiResponse({ status: 200, description: "Projects list for the given creator." })
  async findByCreator(@Param("creatorId", ParseIntPipe) creatorId: number) {
    return this.projectService.findByCreator(creatorId);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all projects (excluding deleted)" })
  @ApiResponse({ status: 200, description: "List of projects." })
  async findAll() {
    return this.projectService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a single project by ID" })
  @ApiResponse({ status: 200, description: "The project." })
  @ApiResponse({ status: 404, description: "Project not found." })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update project details, promotions and group settings" })
  @ApiResponse({ status: 200, description: "Project successfully updated." })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 404, description: "Project not found." })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Patch(":idProject/:idPromotion/status")
  @ApiOperation({ summary: "Update the status of a project for a specific promotion" })
  @ApiResponse({ status: 200, description: "Project status successfully updated." })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 404, description: "Project or promotion not found." })
  async updateStatus(
    @Param("idProject", ParseIntPipe) idProject: number,
    @Param("idPromotion", ParseIntPipe) idPromotion: number,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    return await this.projectService.updateStatus(idProject, idPromotion, updateProjectStatusDto.status);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete a project" })
  @ApiResponse({ status: 200, description: "Project successfully deleted." })
  @ApiResponse({ status: 404, description: "Project not found." })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.projectService.remove(id);
  }

  @Get("by-promotions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve projects grouped by promotion IDs" })
  @ApiResponse({
    status: 200,
    description: "Map of promotionId to array of projects.",
    schema: {
      example: {
        "1": [{ id: 5, name: "Proj A" /* … */ }],
        "2": [{ id: 6, name: "Proj B" /* … */ }],
      },
    },
  })
  async findByPromotions(@Query("promotionIds") promotionIds: string) {
    const ids = promotionIds
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));
    return this.projectService.findByPromotions(ids);
  }

  @Get('student/:studentId/detailed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get student’s paginated projects with group status, by promotion',
  })
  @ApiParam({ name: 'studentId', type: Number, description: 'Student user ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'size', type: Number, required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Map promotionId → paginated ProjectWithGroupStatus',
  })
  async findByStudentDetailed(
      @Param('studentId', ParseIntPipe) studentId: number,
      @Query('page') page?: string,
      @Query('size') size?: string,
  ): Promise<ProjectsByPromotion> {
    const p = page ? parseInt(page, 10) : 1;
    const s = size ? parseInt(size, 10) : 10;
    return this.projectService.findProjectsForStudent(studentId, p, s);
  }
}
