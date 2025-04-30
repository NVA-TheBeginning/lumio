import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Page number (>=1)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 10, description: "Page size (>=1)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size = 10;
}
