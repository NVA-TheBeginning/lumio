import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  constructor(name: string, description: string, creatorId: number, students_csv: string) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.students_csv = students_csv;
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
  students_csv: string;
}
