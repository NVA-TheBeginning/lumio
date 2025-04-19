import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  constructor(name: string, description: string, creatorId: number, studentIds: number[]) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.studentIds = studentIds;
  }

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  creatorId: number;

  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  studentIds: number[];
}
