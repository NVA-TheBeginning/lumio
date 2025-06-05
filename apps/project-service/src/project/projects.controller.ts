import {
  BadRequestException,
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
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser, JwtUser } from "@/common/decorators/get-user.decorator";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ProjectStudentDto } from "./dto/project-student.dto";
import { ProjectTeacherDto } from "./dto/project-teacher.dto";
import { UpdateProjectDto, UpdateProjectStatusDto } from "./dto/update-project.dto";
import { ProjectService } from "./projects.service";

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

  @Get("myprojects")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get projects for the logged-in user (teachers see theirs, students see those they belong to)",
  })
  @ApiQuery({ name: "page", type: Number, required: false, example: 1 })
  @ApiQuery({ name: "size", type: Number, required: false, example: 10 })
  @ApiQuery({
    name: "userId",
    type: Number,
    required: true,
    description: "ID de l’utilisateur (validé via gateway)",
  })
  @ApiQuery({
    name: "userRole",
    type: String,
    required: true,
    description: "Rôle de l’utilisateur (TEACHER, ADMIN ou STUDENT)",
  })
  @ApiResponse({ status: 200, description: "Paginated list or map of projects" })
  async findMine(
    @Query("page", ParseIntPipe) page: number,
    @Query("size", ParseIntPipe) size: number,
    @Query("userId") userId: number,
    @Query("userRole") userRole: "TEACHER" | "ADMIN" | "STUDENT",
  ) {
    if (!(userId && userRole)) {
      throw new BadRequestException("userId and userRole are required query parameters.");
    }
    if (userRole === "TEACHER" || userRole === "ADMIN") {
      return this.projectService.findByCreator(Number(userId), Number(page), Number(size));
    }
    return this.projectService.findProjectsForStudent(Number(userId), Number(page), Number(size));
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all projects (excluding deleted)" })
  @ApiResponse({ status: 200, description: "List of projects." })
  async findAll() {
    return this.projectService.findAll();
  }

  @Get(":id/teacher")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve a project with detailed info as a teacher" })
  @ApiParam({ name: "id", type: Number, description: "Project ID" })
  @ApiResponse({ status: 200, description: "Detailed project info", type: ProjectTeacherDto })
  @ApiResponse({ status: 404, description: "Project not found" })
  async findOneProjectTeacher(
    @Param("id", ParseIntPipe) id: number,
    @Query("userId") userId: number,
  ): Promise<ProjectTeacherDto> {
    return this.projectService.getProjectInfoTeacher(id, Number(userId));
  }

  @Get(":id/student")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve a project with detailed info as a student" })
  @ApiParam({ name: "id", type: Number, description: "Project ID" })
  @ApiResponse({ status: 200, description: "Detailed project info", type: ProjectStudentDto })
  @ApiResponse({ status: 404, description: "Project not found" })
  async findOneProjectStudent(
    @Param("id", ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
  ): Promise<ProjectStudentDto> {
    const userId = Number(user.sub);
    return this.projectService.getProjectInfoStudent(id, userId);
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
}
