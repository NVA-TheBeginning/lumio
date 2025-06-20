import { ApiProperty } from "@nestjs/swagger";
import { CriterionType } from "@prisma-evaluation/client";
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator";

export class CreateCriteriaDto {
  @ApiProperty({ description: "Nom du critère" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Poids (%)" })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: "Type de critère", enum: CriterionType })
  @IsEnum(CriterionType)
  type: CriterionType;

  @ApiProperty({ description: "Évaluation individuelle ?" })
  @IsBoolean()
  individual: boolean;
}
