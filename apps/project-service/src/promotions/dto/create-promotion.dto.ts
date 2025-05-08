import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  creatorId: number;

  @IsNotEmpty()
  @IsNumber({}, { each: true })
  studentIds: number[];
}
