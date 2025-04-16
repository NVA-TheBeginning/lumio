import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import type { FastifyRequest } from "fastify";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class SignUpDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class OAuthDto {
  @ApiProperty({ example: "ya29.a0AfH6SM..." })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/login", "POST", loginDto);
  }

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
  })
  @ApiResponse({ status: 409, description: "Email already in use" })
  async signup(@Body() signUpDto: SignUpDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/signup", "POST", signUpDto);
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  @ApiOperation({ summary: "Generate new access/refresh token from validated user" })
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: FastifyRequest & { refreshToken: string }): Promise<unknown> {
    const { refreshToken } = req;
    return this.proxy.forwardRequest("auth", "/auth/refresh", "POST", { refreshToken });
  }

  @Post("oauth/google")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: OAuthDto })
  @ApiOperation({ summary: "Authenticate using Google OAuth2 token" })
  async googleOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/google", "POST", oauthDto);
  }

  @Post("oauth/microsoft")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: OAuthDto })
  @ApiOperation({ summary: "Authenticate using Microsoft OAuth2 token" })
  async microsoftOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/microsoft", "POST", oauthDto);
  }
}
