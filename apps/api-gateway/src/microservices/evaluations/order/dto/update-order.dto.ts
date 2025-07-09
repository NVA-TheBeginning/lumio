import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: "Nouveau groupe" })
  @IsOptional()
  @IsInt()
  groupId?: number;

  @ApiPropertyOptional({ description: "Nouvelle position (1-based)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  orderNumber?: number;
}
