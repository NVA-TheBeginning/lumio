import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, Min } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({ description: "ID du groupe" })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: "Position (1-based)" })
  @IsInt()
  @Min(1)
  orderNumber: number;

  @ApiProperty({ description: "Horaire planifié (ISO8601)" })
  @IsDateString()
  scheduledDatetime: string;
}
