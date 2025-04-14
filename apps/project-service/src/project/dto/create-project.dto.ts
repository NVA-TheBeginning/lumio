import { GroupMode } from "@prisma-project/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class GroupSettingDto {
  constructor(promotionId: number, minMembers: number, maxMembers: number, mode: GroupMode, deadline: string) {
    this.promotionId = promotionId;
    this.minMembers = minMembers;
    this.maxMembers = maxMembers;
    this.mode = mode;
    this.deadline = deadline;
  }

  @IsInt()
  @IsNotEmpty()
  promotionId: number;

  @IsInt()
  @IsNotEmpty()
  minMembers: number;

  @IsInt()
  @IsNotEmpty()
  maxMembers: number;

  @IsEnum(GroupMode)
  @IsNotEmpty()
  mode: GroupMode;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}

export class CreateProjectDto {
  constructor(
    name: string,
    description: string,
    creatorId: number,
    groupSettings: GroupSettingDto[],
    promotionIds: number[],
  ) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.groupSettings = groupSettings;
    this.promotionIds = promotionIds;
  }

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsNotEmpty()
  creatorId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings: GroupSettingDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  promotionIds: number[];
}
