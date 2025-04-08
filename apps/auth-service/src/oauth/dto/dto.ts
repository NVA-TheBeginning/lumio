import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class OAuthDto {
  @ApiProperty({ example: "ya29.a0AfH6SM..." })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
