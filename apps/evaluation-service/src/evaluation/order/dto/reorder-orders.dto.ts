import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class ReorderDto {
  @ApiProperty({ example: 3 }) @IsInt() @Min(1) from!: number;
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) to!: number;
}
