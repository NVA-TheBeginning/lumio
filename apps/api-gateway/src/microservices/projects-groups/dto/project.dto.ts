import { ApiProperty } from "@nestjs/swagger";

enum ProjectStatus {
  VISIBLE = "VISIBLE",
  DRAFT = "DRAFT",
  HIDDEN = "HIDDEN",
}

export class UpdateProjectStatusDto {
  @ApiProperty({
    description: "The new status of the project",
    enum: ProjectStatus,
  })
  status: ProjectStatus;
}
