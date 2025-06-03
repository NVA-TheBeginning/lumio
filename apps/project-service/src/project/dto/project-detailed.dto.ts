import { ApiProperty } from "@nestjs/swagger";

export class PromotionInfo {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() status!: string;
}

export class GroupMemberDto {
  @ApiProperty() studentId!: number;
}

export class GroupDto {
  @ApiProperty() id!: number;
  @ApiProperty() name?: string;
  @ApiProperty({ type: [GroupMemberDto] }) members!: GroupMemberDto[];
}

export class ProjectDetailedDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ type: [PromotionInfo], required: false })
  promotions?: PromotionInfo[];
  @ApiProperty({ type: [GroupDto], required: false })
  groups?: GroupDto[];
}
