import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsString, ValidateNested } from "class-validator";

export class SingleStudentAccountDto {
  @ApiProperty({ example: "student@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  password: string;
}

export class CreateMultipleStudentAccountsDto {
  @ApiProperty({
    type: [SingleStudentAccountDto],
    description: "Array of students",
  })
  @ValidateNested({ each: true })
  @Type(() => SingleStudentAccountDto)
  users: SingleStudentAccountDto[];
}
