import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export enum GroupMode {
  MANUAL = "MANUAL",
  RANDOM = "RANDOM",
  FREE = "FREE",
}

/**
 * DTO pour créer plusieurs groupes vides d'une ProjectPromotion donnée.
 */
export class CreateGroupDto {
  @IsNotEmpty()
  @IsNumber()
  numberOfGroups!: number;

  @IsOptional()
  @IsString()
  baseName?: string;
}

/**
 * DTO pour mettre à jour un groupe existant.
 */
export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO pour ajouter des membres à un groupe.
 */
export class AddMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  studentIds!: number[];
}

/**
 * DTO pour récupérer ou mettre à jour les réglages d'un project–promotion.
 */
export class GroupSettingsDto {
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}
