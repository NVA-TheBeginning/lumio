import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
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
  @ApiProperty({ example: 5, description: "ID de la promotion associée" })
  @IsNotEmpty()
  @IsNumber()
  promotionId!: number;

  @ApiProperty({ example: 2, description: "Nombre minimum d'étudiants par groupe" })
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @ApiProperty({ example: 4, description: "Nombre maximum d'étudiants par groupe" })
  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @ApiProperty({ enum: GroupMode, description: "Mode de constitution des groupes" })
  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @ApiProperty({
    example: "2025-05-15T23:59:59Z",
    description: "Date limite de constitution des groupes (ISO 8601)",
  })
  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}

export class CreateProjectDto {
  @ApiProperty({ example: "Mon super projet", description: "Nom du projet" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: "Description détaillée du projet", description: "Description du projet" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 1, description: "ID de l'enseignant créateur" })
  @IsNotEmpty()
  @IsNumber()
  creatorId!: number;

  @ApiProperty({
    example: [1, 2],
    description: "Liste des IDs de promotions associées",
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  promotionIds!: number[];

  @ApiProperty({
    type: [GroupSettingDto],
    description: "Paramètres de constitution des groupes pour chaque promotion",
  })
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
