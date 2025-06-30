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

export class GroupMemberDto {
  @ApiProperty()
  studentId!: number;
}

/** Groupe + membres */
export class GroupWithMembersDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  promotionId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [GroupMemberDto] })
  members!: GroupMemberDto[];
}

/** Projet de base (on expose seulement les colonnes utiles côté gateway) */
export class ProjectDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  creatorId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

/** Payload renvoyé par le micro-service “project” après création */
export class ProjectWithGroupsDto {
  @ApiProperty({ type: ProjectDto })
  project!: ProjectDto;

  @ApiProperty({ type: [GroupWithMembersDto] })
  groups!: GroupWithMembersDto[];
}
