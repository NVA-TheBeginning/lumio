import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePromotionDto {
  @ApiProperty({ description: "Nom de la promotion", example: "Promo 2025" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Description de la promotion", example: "Description détaillée" })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "CSV des emails étudiants (séparés par virgule)",
    example: "alice@example.com,bob@example.com",
  })
  @IsString()
  @IsNotEmpty()
  students_csv!: string;

  @ApiProperty({ description: "ID de l’utilisateur créateur", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  creatorId!: number;
}

export class CreateStudentDto {
  @ApiProperty({ description: "Prénom de l'étudiant", example: "Alice" })
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @ApiProperty({ description: "Nom de l'étudiant", example: "Dupont" })
  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @ApiProperty({ description: "Email de l'étudiant", example: "alice@example.com" })
  @IsString()
  @IsNotEmpty()
  email!: string;
}

export class AddStudentsDto {
  @ApiProperty({ description: "Liste des étudiants à ajouter", type: [CreateStudentDto] })
  @IsNotEmpty()
  students!: CreateStudentDto[];
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({ description: "Nom mis à jour de la promotion", example: "Promo 2026" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Description mise à jour", example: "Nouvelle description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "CSV mis à jour des emails étudiants", example: "charlie@example.com" })
  @IsOptional()
  @IsString()
  students_csv?: string;
}

export class StudentDto {
  @ApiProperty({ description: "ID de l’étudiant", example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: "Adresse email", example: "alice@example.com" })
  @IsString()
  email!: string;

  @ApiProperty({ description: "Prénom", example: "Alice" })
  @IsString()
  firstname!: string;

  @ApiProperty({ description: "Nom", example: "Dupont" })
  @IsString()
  lastname!: string;

  @ApiProperty({ description: "Rôle utilisateur", example: "STUDENT" })
  @IsString()
  role!: string;
}

export class PromotionWithStudentsDto {
  @ApiProperty({ description: "ID de la promotion", example: 1 })
  id!: number;
  @ApiProperty({ description: "Nom", example: "Promo 2025" })
  name!: string;
  @ApiProperty({ description: "Description", example: "..." })
  description!: string;
  @ApiProperty({ description: "ID du créateur", example: 1 })
  creatorId!: number;
  @ApiProperty({ description: "Date de création", example: "2025-04-30T12:00:00Z" })
  createdAt!: Date;
  @ApiProperty({ description: "Date de mise à jour", example: "2025-05-01T12:00:00Z" })
  updatedAt!: Date;
  @ApiProperty({ description: "Liste des étudiants", type: [StudentDto] })
  students!: StudentDto[];
}
