import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class PlagiarismCheckDto {
  @ApiProperty({
    description: "The ID of the project to analyze",
    example: "proj_123"
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: "The ID of the promotion/class", 
    example: "promo_456"
  })
  @IsString()
  @IsNotEmpty()
  promotionId: string;
}
