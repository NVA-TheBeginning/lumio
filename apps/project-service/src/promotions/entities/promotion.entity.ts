import { ApiProperty } from "@nestjs/swagger";
import { Promotion } from "@prisma-project";

export class PromotionEntity implements Promotion {
  constructor(partial: Partial<PromotionEntity>) {
    Object.assign(this, partial);
  }

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
