import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsOptional } from "class-validator";

export class GenerateOrdersDto {
  @ApiPropertyOptional({ enum: ["SEQUENTIAL", "RANDOM"] })
  @IsOptional()
  @IsIn(["SEQUENTIAL", "RANDOM"])
  algorithm: "SEQUENTIAL" | "RANDOM" = "SEQUENTIAL";

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  shuffleSeed?: number;

  @ApiProperty({ type: [Number], description: "Groupes concernés" })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  groupIds!: number[];
}
