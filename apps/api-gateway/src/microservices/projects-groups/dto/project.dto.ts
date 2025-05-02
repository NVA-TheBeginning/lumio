import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

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
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
