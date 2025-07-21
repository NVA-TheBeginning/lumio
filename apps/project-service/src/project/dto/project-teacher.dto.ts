import { ApiProperty } from "@nestjs/swagger";

export class PromotionDto {
  @ApiProperty({ description: "Promotion unique identifier", example: 1 })
  id: number;

  @ApiProperty({ description: "Promotion name", example: "Master 1 - Computer Science" })
  name: string;

  @ApiProperty({ description: "Promotion description", example: "First year master students in computer science" })
  description: string;

  @ApiProperty({
    description: "Project status",
    example: "active",
  })
  status: string;
}

export class ProjectTeacherDto {
  @ApiProperty({ description: "Project unique identifier", example: 1 })
  id: number;

  @ApiProperty({ description: "Project name", example: "Web Development Project" })
  name: string;

  @ApiProperty({ description: "Project description", example: "A comprehensive web development project for students" })
  description: string;

  @ApiProperty({ description: "Creator user ID", example: 123 })
  creatorId: number;

  @ApiProperty({ description: "Whether reports are enabled for this project", example: true })
  hasReport: boolean;

  @ApiProperty({ description: "Project creation date", example: "2024-01-15T10:30:00Z" })
  createdAt: string;

  @ApiProperty({ description: "Last update date", example: "2024-01-20T14:45:00Z" })
  updatedAt: string;

  @ApiProperty({ description: "Deletion date if deleted", example: null, nullable: true })
  deletedAt: string | null;

  @ApiProperty({ description: "List of promotions for this project", type: [PromotionDto] })
  promotions: PromotionDto[];
}
