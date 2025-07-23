import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateFinalGradeDto {
  @ApiProperty({ description: "ID de l'étudiant" })
  @IsInt()
  studentId: number;

  @ApiProperty({ description: "Note finale" })
  @IsNumber()
  finalGrade: number;

  @ApiProperty({ description: "Commentaire", required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
