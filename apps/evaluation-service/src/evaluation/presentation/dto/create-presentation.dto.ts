import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional } from "class-validator";

export class CreatePresentationDto {
  @ApiProperty({ description: "ID du project" })
  @IsInt()
  projectId: number;

  @ApiProperty({ description: "ID de la promotion" })
  @IsInt()
  promotionId: number;

  @ApiProperty({ description: "Début de la soutenance (ISO8601)" })
  @IsDateString()
  startDatetime: string;

  @ApiProperty({ description: "Fin de la soutenance (ISO8601)", required: false })
  @IsOptional()
  @IsDateString()
  endDatetime?: string;

  @ApiProperty({ description: "Durée par groupe (en minutes)" })
  @IsInt()
  durationPerGroup: number;
}
