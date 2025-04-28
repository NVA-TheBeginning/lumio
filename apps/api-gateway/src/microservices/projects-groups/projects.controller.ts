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
import {
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
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export enum GroupMode {
  AUTO = "AUTO",
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
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  promotionIds!: number[];

  @ApiProperty({ description: "Group settings for each promotion", type: [GroupSettingDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings!: GroupSettingDto[];
}

@ApiTags("projects")
@Controller("projects")
export class ProjectsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new project with its group settings" })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: "The project has been successfully created", type: Object })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.proxy.forwardRequest("project", "/projects", "POST", createProjectDto);
  }

  @Get("creator/:creatorId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all projects by creator ID" })
  @ApiParam({ name: "creatorId", description: "Creator user ID", type: Number })
  @ApiResponse({ status: 200, description: "Array of projects for the specified creator", type: [Object] })
  async findByCreator(@Param("creatorId", ParseIntPipe) creatorId: number) {
    return this.proxy.forwardRequest("project", `/projects/creator/${creatorId}`, "GET");
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all projects" })
  @ApiResponse({ status: 200, description: "Array of projects", type: [Object] })
  async findAll() {
    return this.proxy.forwardRequest("project", "/projects", "GET");
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a single project by ID" })
  @ApiParam({ name: "id", description: "Project ID", type: Number })
  @ApiResponse({ status: 200, description: "The project", type: Object })
  @ApiResponse({ status: 404, description: "Project not found" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/projects/${id}`, "GET");
  }

  @Get("by-promotions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get projects grouped by promotions" })
  @ApiQuery({
    name: "promotionIds",
    description: "Comma-separated list of promotion IDs",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Map of promotionId to array of projects",
    schema: {
      example: { "1": [{ id: 5, name: "Proj A" }], "2": [{ id: 6, name: "Proj B" }] },
    },
  })
  findByPromotions(@Query("promotionIds") promotionIds: string) {
    return this.proxy.forwardRequest("project", "/projects/by-promotions", "GET", undefined, { promotionIds });
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
