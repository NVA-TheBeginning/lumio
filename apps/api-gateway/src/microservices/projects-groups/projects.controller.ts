import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
} from 'class-validator';
import { MicroserviceProxyService } from '@/proxies/microservice-proxy.service.js';

export enum GroupMode {
  AUTO = 'AUTO',
  FREE = 'FREE',
  MANUAL = 'MANUAL',
}

export class GroupSettingDto {
  @ApiResponse({ description: 'Promotion ID to configure groups for', type: Number,  })
  @IsNotEmpty()
  @IsNumber()
  promotionId!: number;

  @ApiResponse({ description: 'Minimum members per group', type: Number })
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @ApiResponse({ description: 'Maximum members per group', type: Number })
  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @ApiResponse({ description: 'Mode of grouping', enum: GroupMode })
  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @ApiResponse({ description: 'Deadline for group formation (ISO date string)', type: String, format: 'date-time' })
  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}

export class CreateProjectDto {
  @ApiResponse({ description: 'Project name', type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiResponse({ description: 'Detailed project description', type: String })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiResponse({ description: 'User ID who creates the project', type: Number })
  @IsNotEmpty()
  @IsNumber()
  creatorId!: number;

  @ApiResponse({ description: 'Array of promotion IDs', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  promotionIds!: number[];

  @ApiResponse({ description: 'Group settings for each promotion', type: [GroupSettingDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings!: GroupSettingDto[];
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project with its group settings' })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: 'The project has been successfully created', type: Object })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.proxy.forwardRequest('project', '/projects', 'POST', createProjectDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Array of projects', type: [Object] })
  async findAll() {
    return this.proxy.forwardRequest('project', '/projects', 'GET');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'The project', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proxy.forwardRequest('project', `/projects/${id}`, 'GET');
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 200, description: 'Project successfully updated', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateProjectDto: Partial<CreateProjectDto>,
  ) {
    return this.proxy.forwardRequest('project', `/projects/${id}`, 'PATCH', updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Project successfully deleted', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.proxy.forwardRequest('project', `/projects/${id}`, 'DELETE');
  }
}
