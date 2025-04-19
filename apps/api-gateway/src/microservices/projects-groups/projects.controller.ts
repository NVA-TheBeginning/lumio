import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
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
  @IsNotEmpty()
  @IsNumber()
  promotionId!: number;

  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsNumber()
  creatorId!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  promotionIds!: number[];

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
  @ApiCreatedResponse({
    description: "The project has been successfully created",
    type: Object,
  })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.proxy.forwardRequest("project", "/projects", "POST", createProjectDto);
  }
}
