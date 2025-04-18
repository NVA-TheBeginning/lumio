import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpDto {
  @ApiProperty({ example: "user@example.com", description: "User's email address", type: "string" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "password123", description: "User's password", type: "string" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class SignInDto {
  @ApiProperty({ example: "user@example.com", description: "User's email address", type: "string" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "password123", description: "User's password", type: "string" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: "eyJhbGciOi...", description: "Refresh token", type: "string" })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
