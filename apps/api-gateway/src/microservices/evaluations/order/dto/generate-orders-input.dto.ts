import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional } from "class-validator";

export class GenerateOrdersInputDto {
  @ApiPropertyOptional({ enum: ["SEQUENTIAL", "RANDOM"] })
  @IsOptional()
  @IsIn(["SEQUENTIAL", "RANDOM"])
  algorithm?: "SEQUENTIAL" | "RANDOM" = "SEQUENTIAL";

  @ApiPropertyOptional({ description: "Graine pour l’aléatoire" })
  @IsOptional()
  @IsInt()
  shuffleSeed?: number;
}
