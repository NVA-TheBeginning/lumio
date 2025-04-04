import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpDto {
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class SignInDto {
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
