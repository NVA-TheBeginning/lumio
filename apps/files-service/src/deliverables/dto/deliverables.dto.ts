import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DeliverableType } from "@prisma-files/client";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsDecimal, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
  @IsDecimal()
  @Type(() => Number)
  lateSubmissionPenalty: number;

  @ApiProperty({ description: "Deliverable type", enum: DeliverableType })
  @IsEnum(DeliverableType)
  type: DeliverableType;
}

export class UpdateDeliverableDto {
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
  @IsDecimal()
  @IsOptional()
  @Type(() => Number)
  lateSubmissionPenalty?: number;

  @ApiPropertyOptional({ description: "Deliverable type", enum: DeliverableType })
  @IsEnum(DeliverableType)
  @IsOptional()
  type?: DeliverableType;
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
