import { Promotion } from "@prisma-project";

export class PromotionEntity implements Promotion {
  constructor(partial: Partial<PromotionEntity>) {
    Object.assign(this, partial);
  }

  id!: number;

  name!: string;

  description!: string;

  creatorId!: number;

  createdAt!: Date;

  updatedAt!: Date;

  students?: number[];
}
