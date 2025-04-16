import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  constructor(name: string, description: string, creatorId: number, studentsIds: number[]) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.studentsIds = studentsIds;
  }

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  creatorId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  studentsIds: number[];
}
