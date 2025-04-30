import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({ description: "Nombre de groupes à créer", type: Number, example: 3 })
  @IsNotEmpty()
  @IsNumber()
  numberOfGroups!: number;

  @ApiPropertyOptional({ description: "Base de nom pour les groupes (optionnel)", type: String, example: "Groupe" })
  @IsOptional()
  @IsString()
  baseName?: string;
}

/**
 * DTO pour mettre à jour un groupe existant.
 */
export class UpdateGroupDto {
  @ApiPropertyOptional({ description: "Nouveau nom du groupe", type: String, example: "Équipe A" })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO pour ajouter des membres à un groupe.
 */
export class AddMembersDto {
  @ApiProperty({ description: "Liste des IDs d'étudiants à ajouter", type: [Number], example: [1, 2, 3] })
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
  @ApiProperty({ description: "Nombre minimum de membres par groupe", type: Number, example: 2 })
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @ApiProperty({ description: "Nombre maximum de membres par groupe", type: Number, example: 5 })
  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @ApiProperty({ description: "Mode de création des groupes", enum: GroupMode, example: GroupMode.FREE })
  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @ApiProperty({
    description: "Date limite de formation des groupes (ISO date string)",
    type: String,
    format: "date-time",
    example: "2025-12-31T23:59:59Z",
  })
  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}
