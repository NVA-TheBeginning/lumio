import { GroupMode } from "@prisma-project/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class GroupSettingDto {
  @IsInt()
  @IsNotEmpty()
  promotionId!: number;

  @IsInt()
  @IsNotEmpty()
  minMembers!: number;

  @IsInt()
  @IsNotEmpty()
  maxMembers!: number;

  @IsEnum(GroupMode)
  @IsNotEmpty()
  mode!: GroupMode;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @IsNotEmpty()
  creatorId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupSettingDto)
  groupSettings!: GroupSettingDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  promotionIds!: number[];
}
