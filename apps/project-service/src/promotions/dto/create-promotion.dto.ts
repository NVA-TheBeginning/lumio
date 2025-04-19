import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  constructor(name: string, description: string, creatorId: number, studentIds: number[]) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.studentIds = studentIds;
  }

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
