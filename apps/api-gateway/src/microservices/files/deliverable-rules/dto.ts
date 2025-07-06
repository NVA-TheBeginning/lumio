import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional } from "class-validator";

export enum RuleType {
  SIZE_LIMIT = "SIZE_LIMIT",
  FILE_PRESENCE = "FILE_PRESENCE",
  DIRECTORY_STRUCTURE = "DIRECTORY_STRUCTURE",
}

export interface SizeLimitRuleDetails {
  maxSizeInBytes: number;
}

export interface FilePresenceRuleDetails {
  requiredFiles: string[]; // Array of required file paths/names
  allowedExtensions?: string[]; // Array of allowed file extensions (e.g., ['.js', '.ts'])
  forbiddenExtensions?: string[]; // Array of forbidden file extensions
}

export interface DirectoryStructureRuleDetails {
  requiredDirectories: string[]; // Array of required directory paths
  forbiddenDirectories?: string[]; // Array of forbidden directory names/paths
}

export class CreateDeliverableRuleDto {
  @ApiProperty({ description: "Deliverable ID" })
  @IsInt()
  @Type(() => Number)
  deliverableId: number;

  @ApiProperty({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiProperty({
    description: "Rule details configuration",
    example: {
      [RuleType.SIZE_LIMIT]: { maxSizeInBytes: 10485760 },
      [RuleType.FILE_PRESENCE]: { requiredFiles: ["README.md", "src/main.js"], allowedExtensions: [".js", ".json"] },
      [RuleType.DIRECTORY_STRUCTURE]: { requiredDirectories: ["src", "tests"] },
    },
  })
  @IsObject()
  @IsNotEmpty()
  ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
}

export class UpdateDeliverableRuleDto {
  @ApiPropertyOptional({ description: "Rule type", enum: RuleType })
  @IsEnum(RuleType)
  @IsOptional()
  ruleType?: RuleType;

  @ApiPropertyOptional({
    description: "Rule details configuration",
    example: {
      [RuleType.SIZE_LIMIT]: { maxSizeInBytes: 10485760 },
      [RuleType.FILE_PRESENCE]: { requiredFiles: ["README.md", "src/main.js"], allowedExtensions: [".js", ".json"] },
      [RuleType.DIRECTORY_STRUCTURE]: { requiredDirectories: ["src", "tests"] },
    },
  })
  @IsObject()
  @IsOptional()
  ruleDetails?: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
}

export class RuleIdParam {
  @ApiProperty({ description: "Rule ID" })
  @IsInt()
  @Type(() => Number)
  id: number;
}
