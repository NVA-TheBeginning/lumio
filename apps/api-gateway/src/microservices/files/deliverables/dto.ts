import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateDeliverableDto {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  promotionId: number;

  @ApiProperty({ description: "Deliverable name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Deliverable description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Submission deadline" })
  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @ApiProperty({ description: "Allow late submission" })
  @IsBoolean()
  allowLateSubmission: boolean;

  @ApiProperty({ description: "Late submission penalty" })
  @IsNumber()
  @Type(() => Number)
  lateSubmissionPenalty: number;

  @ApiProperty({
    description: "Deliverable type",
    isArray: true,
  })
  @ArrayNotEmpty()
  type: string[];
}

export class UpdateDeliverableDto {
  @ApiProperty({ description: "Deliverable ID" })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: "Project ID" })
  @IsInt()
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  promotionId: number;

  @ApiPropertyOptional({ description: "Deliverable name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Deliverable description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Submission deadline" })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deadline?: Date;

  @ApiPropertyOptional({ description: "Allow late submission" })
  @IsBoolean()
  @IsOptional()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({ description: "Late submission penalty" })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lateSubmissionPenalty?: number;

  @ApiPropertyOptional({
    description: "Deliverable type",
    isArray: true,
  })
  @ArrayNotEmpty()
  type: string[];
}

export class DeliverableIdParams {
  @ApiProperty({ description: "Deliverable ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  @Type(() => Number)
  promotionId: number;
}

export class ProjectIdParams {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;
}

export class CalendarResponseDto {
  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  promotionId: number;

  @ApiProperty({ description: "Promotion name" })
  @IsString()
  promotionName: string;

  @ApiProperty({ description: "Projects with their deliverables" })
  @IsArray()
  projects: Array<{
    projectId: number;
    projectName: string;
    projectDescription: string;
    deliverables: Array<{
      id: number;
      projectId: number;
      promotionId: number;
      name: string;
      description?: string;
      deadline: string;
      allowLateSubmission: boolean;
      lateSubmissionPenalty: number;
      type: string[];
      createdAt: string;
    }>;
  }>;
}
