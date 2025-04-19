import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePromotionDto {
  constructor(name: string, description: string, creatorId: number, studentIds: number[]) {
    this.name = name;
    this.description = description;
    this.creatorId = creatorId;
    this.studentIds = studentIds;
  }

  @ApiProperty({ type: "string" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: "string" })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ type: "number" })
  @IsNotEmpty()
  @IsNumber()
  creatorId: number;

  @ApiProperty({ type: "number", isArray: true })
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  studentIds: number[];
}
