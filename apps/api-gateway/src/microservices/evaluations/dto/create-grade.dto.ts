import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ description: "ID du critère" })
  @IsInt()
  gradingCriteriaId!: number;

  @ApiProperty({ description: "ID du groupe", required: false })
  @IsOptional()
  @IsInt()
  groupId?: number;

  @ApiProperty({ description: "ID de l’étudiant (pour notes individuelles)", required: false })
  @IsOptional()
  @IsInt()
  studentId?: number;

  @ApiProperty({ description: "Valeur de la note" })
  @IsNumber()
  gradeValue!: number;

  @ApiProperty({ description: "Commentaire", required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
