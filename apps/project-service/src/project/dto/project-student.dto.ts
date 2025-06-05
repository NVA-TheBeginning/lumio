import { ApiProperty } from "@nestjs/swagger";

export class ProjectStudentDto {
  @ApiProperty({ description: "Project unique identifier", example: 1 })
  id: number;

  @ApiProperty({ description: "Project name", example: "Web Development Project" })
  name: string;

  @ApiProperty({ description: "Project description", example: "A comprehensive web development project for students" })
  description: string;

  @ApiProperty({ description: "Creator user ID", example: 123 })
  creatorId: number;

  @ApiProperty({ description: "Project creation date", example: "2024-01-15T10:30:00Z" })
  createdAt: string;

  @ApiProperty({ description: "Last update date", example: "2024-01-20T14:45:00Z" })
  updatedAt: string;

  @ApiProperty({ description: "Deletion date if deleted", example: null, nullable: true })
  deletedAt: string | null;

  @ApiProperty({ description: "Promotion ID", example: 1 })
  promotionId: number;
}
