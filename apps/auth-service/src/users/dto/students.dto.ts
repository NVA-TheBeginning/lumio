import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class CreateStudentDto {
  @ApiProperty({ description: "Student's last name" })
  @IsNotEmpty()
  @IsString()
  lastname!: string;

  @ApiProperty({ description: "Student's first name" })
  @IsNotEmpty()
  @IsString()
  firstname!: string;

  @ApiProperty({ description: "Student's email address" })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class UpdateStudentDto {
  @ApiProperty({ description: "Student's last name", required: false })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiProperty({ description: "Student's first name", required: false })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiProperty({ description: "Student's email address", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: "New password for the student" })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
  })
  newPassword!: string;
}
