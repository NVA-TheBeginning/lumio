import { ApiProperty, PartialType } from "@nestjs/swagger";
import { ProjectStatus } from "@prisma-project/client";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProjectStatusDto {
  @ApiProperty({
    description: "The new status of the project",
    enum: ProjectStatus,
    enumName: "ProjectStatus",
  })
  status: ProjectStatus;
}
