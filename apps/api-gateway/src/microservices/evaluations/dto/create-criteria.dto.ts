import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator";

export enum CriterionType {
  DELIVERABLE = "DELIVERABLE",
  REPORT = "REPORT",
  PRESENTATION = "PRESENTATION",
}

export class CreateCriteriaDto {
  @ApiProperty({ description: "Nom du critère" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "Poids (%)" })
  @IsNumber()
  weight!: number;

  @ApiProperty({ description: "Type de critère", enum: CriterionType })
  @IsEnum(CriterionType)
  type!: CriterionType;

  @ApiProperty({ description: "Évaluation individuelle ?" })
  @IsBoolean()
  individual!: boolean;
}
