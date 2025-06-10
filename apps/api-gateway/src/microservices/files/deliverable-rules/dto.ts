import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum RuleType {
  NAMING = "NAMING",
  SIZE_LIMIT = "SIZE_LIMIT",
  FILE_TYPE = "FILE_TYPE",
  DEADLINE = "DEADLINE",
}

export class CreateDeliverableRuleDto {
  @ApiProperty({ description: "Deliverable ID" })
  @IsInt()
  @Type(() => Number)
  deliverableId: number;

  @ApiProperty({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiProperty({ description: "Rule details (e.g., JSON or text configuration)" })
  @IsString()
  @IsNotEmpty()
  ruleDetails: string;
}

export class UpdateDeliverableRuleDto {
  @ApiPropertyOptional({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  @IsOptional()
  ruleType?: RuleType;

  @ApiPropertyOptional({ description: "Rule details (e.g., JSON or text configuration)" })
  @IsString()
  @IsOptional()
  ruleDetails?: string;
}

export class RuleIdParam {
  @ApiProperty({ description: "Rule ID" })
  @IsInt()
  @Type(() => Number)
  id: number;
}
