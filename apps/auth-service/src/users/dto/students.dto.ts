import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class CreateStudentDto {
  constructor(lastname: string, firstname: string, email: string) {
    this.lastname = lastname;
    this.firstname = firstname;
    this.email = email;
  }

  @ApiProperty({ description: "Student's last name" })
  @IsNotEmpty()
  @IsString()
  lastname: string;

  @ApiProperty({ description: "Student's first name" })
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @ApiProperty({ description: "Student's email address" })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class UpdateStudentDto {
  constructor(lastname: string, firstname: string, email: string) {
    this.lastname = lastname;
    this.firstname = firstname;
    this.email = email;
  }

  @ApiProperty({ description: "Student's last name" })
  @IsString()
  lastname?: string;

  @ApiProperty({ description: "Student's first name" })
  @IsString()
  firstname?: string;

  @ApiProperty({ description: "Student's email address" })
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  constructor(newPassword: string) {
    this.newPassword = newPassword;
  }

  @ApiProperty({ description: "New password for the student" })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
  })
  newPassword: string;
}
