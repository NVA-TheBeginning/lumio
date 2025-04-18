import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class CreateStudentDto {
  @ApiProperty({ description: "Student's last name", type: "string" })
  @IsNotEmpty()
  @IsString()
  lastname!: string;

  @ApiProperty({ description: "Student's first name", type: "string" })
  @IsNotEmpty()
  @IsString()
  firstname!: string;

  @ApiProperty({ description: "Student's email address", type: "string" })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class UpdateStudentDto {
  @ApiProperty({ description: "Student's lastname", required: false, type: "string" })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiProperty({ description: "Student's firstname", required: false, type: "string" })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiProperty({ description: "Student's email address", required: false, type: "string" })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: "New password for the student", type: "string" })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
  })
  newPassword!: string;
}
