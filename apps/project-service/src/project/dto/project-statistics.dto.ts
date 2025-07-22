import { ApiProperty } from "@nestjs/swagger";

export class ProjectStatisticsDto {
  @ApiProperty({ description: "Total number of projects created by the user" })
  totalProjects: number;

  @ApiProperty({ description: "Number of active projects (VISIBLE status)" })
  activeProjects: number;

  @ApiProperty({ description: "Number of draft projects" })
  draftProjects: number;

  @ApiProperty({ description: "Number of hidden projects" })
  hiddenProjects: number;

  @ApiProperty({ description: "Number of promotions the user manages" })
  totalPromotions: number;

  @ApiProperty({ description: "Number of projects the user participates in (for students)" })
  participantProjects?: number;

  @ApiProperty({ description: "Number of groups the user is part of (for students)" })
  groupMemberships?: number;
}
