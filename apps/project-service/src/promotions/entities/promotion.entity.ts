import { ApiProperty } from "@nestjs/swagger";
import { Promotion } from "@prisma-project";

export class PromotionEntity implements Promotion {
  constructor(partial: Partial<PromotionEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: Number })
  creatorId!: number;

  @ApiProperty({ type: String })
  createdAt!: Date;

  @ApiProperty({ type: String })
  updatedAt!: Date;

  @ApiProperty({ type: [Number], description: "List of student IDs in the promotion" })
  students?: number[];
}
