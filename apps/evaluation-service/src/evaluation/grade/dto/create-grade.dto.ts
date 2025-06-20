import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ description: "ID du groupe" })
  @IsInt()
  groupId?: number;

  @ApiProperty({ description: "ID de létudiant (pour note individuelle)", required: false })
  @IsOptional()
  @IsInt()
  studentId?: number;

  @ApiProperty({ description: "Valeur de la note" })
  @IsNumber()
  gradeValue: number;

  @ApiProperty({ description: "Commentaire", required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
