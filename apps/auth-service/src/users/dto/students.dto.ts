import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  lastname!: string;

  @IsNotEmpty()
  @IsString()
  firstname!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
  })
  newPassword!: string;
}
