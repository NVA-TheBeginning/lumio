import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RuleType } from "@prisma-files/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDeliverableRuleDto {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  @Type(() => Number)
  promotionId: number;

  @ApiProperty({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiProperty({ description: "Rule details (e.g., JSON or text configuration)" })
  @IsString()
  @IsNotEmpty()
  ruleDetails: string;
}

export class UpdateDeliverableRuleDto {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  @Type(() => Number)
  promotionId: number;

  @ApiPropertyOptional({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  @IsOptional()
  ruleType?: RuleType;

  @ApiPropertyOptional({ description: "Rule details (e.g., JSON or text configuration)" })
  @IsString()
  @IsOptional()
  ruleDetails?: string;
}

export class DeliverableIdParam {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  @Type(() => Number)
  promotionId: number;
}

export class RuleIdParam {
  @ApiProperty({ description: "Rule ID" })
  @IsInt()
  @Type(() => Number)
  id: number;
}
