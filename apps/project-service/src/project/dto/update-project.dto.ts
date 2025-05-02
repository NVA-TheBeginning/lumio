import { ApiProperty, PartialType } from "@nestjs/swagger";
import { ProjectStatus } from "@prisma-project/client";
import { IsEnum } from "class-validator";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProjectStatusDto {
  @ApiProperty({
    description: "The new status of the project",
    enum: ProjectStatus,
  })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
