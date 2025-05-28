import { ApiProperty } from "@nestjs/swagger";
import { GroupMode } from "@prisma-project/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class GroupSettingDto {
  @ApiProperty({ description: "Promotion ID", example: 1, type: Number })
  @IsInt()
  @IsNotEmpty()
  promotionId!: number;

  @ApiProperty({ description: "Minimum number of group members", example: 2, type: Number })
  @IsInt()
  @IsNotEmpty()
  minMembers!: number;

  @ApiProperty({ description: "Maximum number of group members", example: 5, type: Number })
  @IsInt()
  @IsNotEmpty()
  maxMembers!: number;

  @ApiProperty({ description: "Group assignment mode", enum: GroupMode })
  @IsEnum(GroupMode)
  @IsNotEmpty()
  mode!: GroupMode;

  @ApiProperty({
    description: "Deadline for group formation",
    example: "2025-12-31T23:59:59Z",
    type: String,
    format: "date-time",
  })
  @IsDateString()
  @IsNotEmpty()
  deadline!: string;
}

export class CreateProjectDto {
  @ApiProperty({ description: "Project name", example: "Mon Super Projet", type: String })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Project description", example: "Description détaillée du projet", type: String })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "ID of the user who creates the project",
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  creatorId!: number;

  @ApiProperty({ description: "List of promotion IDs", type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  promotionIds?: number[];

  @ApiProperty({ description: "Group settings per promotion", type: [GroupSettingDto] })
  @IsOptional()
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings?: GroupSettingDto[];
}
