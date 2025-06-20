import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({ description: "ID du groupe" })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: "Numéro d’ordre" })
  @IsInt()
  orderNumber: number;

  @ApiProperty({ description: "Date et heure planifiées (ISO8601)" })
  @IsDateString()
  scheduledDatetime: string;
}
