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
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { GetUser, JwtUser } from "@/common/decorators/get-user.decorator.js";
import { AuthGuard } from "@/jwt/guards/auth.guard.js";
import { CreateReportDto, ReportResponseDto } from "@/microservices/reports/dto.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { GroupWithMembersDto, ProjectDto, ProjectWithGroupsDto, UpdateProjectStatusDto } from "../dto/project.dto.js";

export enum GroupMode {
  AUTO = "RANDOM",
  FREE = "FREE",
  MANUAL = "MANUAL",
}

export class GroupSettingDto {
  @ApiProperty({ description: "Promotion ID to configure groups for", type: Number, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  promotionId!: number;

  @ApiProperty({ description: "Minimum members per group", type: Number, example: 2 })
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @ApiProperty({ description: "Maximum members per group", type: Number, example: 5 })
  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @ApiProperty({ description: "Mode of grouping", enum: GroupMode, example: GroupMode.FREE })
  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @ApiProperty({
    description: "Deadline for group formation (ISO date-time string)",
    type: String,
    format: "date-time",
    example: "2025-12-31T23:59:59Z",
  })
  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}

export class CreateProjectDto {
  @ApiProperty({ description: "Project name", type: String, example: "Mon projet" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: "Detailed project description", type: String, example: "Description détaillée" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ description: "User ID who creates the project", type: Number, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  creatorId!: number;

  @ApiProperty({ description: "Array of promotion IDs", type: [Number], example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  promotionIds!: number[];

  @ApiProperty({ description: "Group settings for each promotion", type: [GroupSettingDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings!: GroupSettingDto[];
}

export class ProjectCreationResponseDto {
  @ApiProperty({ type: ProjectDto })
  project!: ProjectDto;

  @ApiProperty({ type: [GroupWithMembersDto] })
  groups!: GroupWithMembersDto[];

  @ApiProperty({ type: [ReportResponseDto] })
  reports!: ReportResponseDto[];
}

@ApiTags("projects")
@Controller("projects")
export class ProjectsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a project, its groups and the initial reports" })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: "Project, groups and empty reports created", type: ProjectCreationResponseDto })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectCreationResponseDto> {
    const { project, groups } = await this.proxy.forwardRequest<ProjectWithGroupsDto>(
      "project",
      "/projects",
      "POST",
      createProjectDto,
    );

    const reports: ReportResponseDto[] = await Promise.all(
      groups.map((g) =>
        this.proxy.forwardRequest<ReportResponseDto>("report", "/reports", "POST", {
          projectId: project.id,
          groupId: g.id,
          promotionId: g.promotionId,
          sections: [], // squelette vide – ajoute ton template si besoin
        } as CreateReportDto),
      ),
    );

    return { project, groups, reports };
  }

  @Get("myprojects")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all projects by JWT token (teachers paginated, students paginated by promotion)",
  })
  @ApiQuery({ name: "page", type: Number, required: false, example: 1 })
  @ApiQuery({ name: "size", type: Number, required: false, example: 10 })
  @ApiResponse({ status: 200, description: "Paginated list or map of projects", type: Object })
  async findByJWTToken(@GetUser() user: JwtUser, @Query("page") page?: number, @Query("size") size?: number) {
    const p = page ?? 1;
    const s = size ?? 10;

    return this.proxy.forwardRequest("project", "/projects/myprojects", "GET", undefined, {
      page: p,
      size: s,
      userId: user.sub,
      userRole: user.role,
    });
  }

  @Get(":id/teacher")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Retrieve a project with detailed info as a teacher" })
  @ApiParam({ name: "id", type: Number, description: "Project ID" })
  @ApiResponse({ status: 200, description: "Detailed project info" })
  @ApiResponse({ status: 404, description: "Project not found" })
  async findOneProjectTeacher(@Param("id", ParseIntPipe) id: number, @GetUser() user: JwtUser) {
    const userId = Number(user.sub);
    return this.proxy.forwardRequest("project", `/projects/${id}/teacher?userId=${userId}`, "GET", undefined);
  }

  @Get(":id/student")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Retrieve a project with detailed info as a student" })
  @ApiParam({ name: "id", type: Number, description: "Project ID" })
  @ApiResponse({ status: 200, description: "Detailed project info" })
  @ApiResponse({ status: 404, description: "Project not found" })
  async findOneProjectStudent(@Param("id", ParseIntPipe) id: number, @GetUser() user: JwtUser) {
    const userId = Number(user.sub);
    return this.proxy.forwardRequest("project", `/projects/${id}/student?userId=${userId}`, "GET", undefined);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all projects" })
  @ApiResponse({ status: 200, description: "Array of projects", type: [Object] })
  async findAll() {
    return this.proxy.forwardRequest("project", "/projects", "GET");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a project by ID" })
  @ApiParam({ name: "id", description: "Project ID", type: Number })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 200, description: "Project successfully updated", type: Object })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Project not found" })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateProjectDto: Partial<CreateProjectDto>) {
    return this.proxy.forwardRequest("project", `/projects/${id}`, "PATCH", updateProjectDto);
  }

  @Patch(":idProject/:idPromotion/status")
  @ApiOperation({ summary: "Update the status of a project for a specific promotion" })
  @ApiResponse({ status: 200, description: "Project status successfully updated." })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 404, description: "Project or promotion not found." })
  @ApiParam({ name: "idProject", description: "Project ID", type: Number })
  @ApiParam({ name: "idPromotion", description: "Promotion ID", type: Number })
  @ApiBody({
    type: UpdateProjectStatusDto,
    description: "The status to set for the project in the specified promotion",
  })
  async updateStatus(
    @Param("idProject", ParseIntPipe) idProject: number,
    @Param("idPromotion", ParseIntPipe) idPromotion: number,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    return this.proxy.forwardRequest(
      "project",
      `/projects/${idProject}/${idPromotion}/status`,
      "PATCH",
      updateProjectStatusDto,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a project by ID" })
  @ApiParam({ name: "id", description: "Project ID", type: Number })
  @ApiResponse({ status: 200, description: "Project successfully deleted", type: Object })
  @ApiResponse({ status: 404, description: "Project not found" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/projects/${id}`, "DELETE");
  }
}
