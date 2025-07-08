import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class SaveOrdersDto {
  @ApiProperty({ type: [Number], description: "Groupes déjà triés" })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  groupIds!: number[];
}
