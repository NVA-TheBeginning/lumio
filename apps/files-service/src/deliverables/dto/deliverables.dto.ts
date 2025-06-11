import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DeliverableType } from "@prisma-files/client";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
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
    enum: DeliverableType,
    isArray: true,
    example: [DeliverableType.GIT, DeliverableType.FILE],
  })
  @IsEnum(DeliverableType)
  @ArrayNotEmpty()
  type: DeliverableType[];
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

  @ApiPropertyOptional({ description: "Deliverable type", enum: DeliverableType })
  @IsEnum(DeliverableType)
  @IsOptional()
  @IsArray()
  type?: DeliverableType[];
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
