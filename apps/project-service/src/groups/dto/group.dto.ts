import { ApiProperty } from "@nestjs/swagger";
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
  @ApiProperty({
    example: 5,
    description: "Nombre de groupes à créer pour ce project–promotion",
    type: "number",
  })
  @IsNotEmpty()
  @IsNumber()
  numberOfGroups!: number;

  @ApiProperty({
    required: false,
    example: "Groupe",
    description: "Préfixe des noms (Groupe 1, Groupe 2…)",
    type: "string",
  })
  @IsOptional()
  @IsString()
  baseName?: string;
}

/**
 * DTO pour mettre à jour un groupe existant.
 */
export class UpdateGroupDto {
  @ApiProperty({
    required: false,
    example: "Équipe Alpha",
    description: "Nouveau nom du groupe",
    type: "string",
  })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO pour ajouter des membres à un groupe.
 */
export class AddMembersDto {
  @ApiProperty({
    example: [12, 15, 18],
    description: "Liste des IDs d'étudiants à ajouter au groupe",
    type: "array",
  })
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
  @ApiProperty({ example: 2, description: "Nombre minimum d'étudiants par groupe", type: "number" })
  @IsNotEmpty()
  @IsNumber()
  minMembers!: number;

  @ApiProperty({ example: 5, description: "Nombre maximum d'étudiants par groupe", type: "number" })
  @IsNotEmpty()
  @IsNumber()
  maxMembers!: number;

  @ApiProperty({
    enum: GroupMode,
    description: "Mode de constitution des groupes",
  })
  @IsNotEmpty()
  @IsEnum(GroupMode)
  mode!: GroupMode;

  @ApiProperty({
    example: "2025-06-01T23:59:59Z",
    description: "Date limite de constitution (ISO 8601)",
    type: "string",
  })
  @IsNotEmpty()
  @IsDateString()
  deadline!: string;
}
