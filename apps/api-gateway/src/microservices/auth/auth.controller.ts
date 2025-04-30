import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import type { FastifyRequest } from "fastify";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export class LoginDto {
  @IsEmail()
  @ApiProperty({ description: "User email", type: String, example: "user@example.com" })
  email!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ description: "User password", type: String, minLength: 6, example: "secret123" })
  password!: string;
}

export class SignUpDto {
  @IsEmail()
  @ApiProperty({ description: "User email", type: String, example: "user@example.com" })
  email!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ description: "User password", type: String, minLength: 6, example: "secret123" })
  password!: string;
}

export class OAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "OAuth provider token", type: String, example: "ya29.a0ARrdaM..." })
  token!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "Refresh token", type: String, example: "eazezaeaz" })
  refreshToken!: string;
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
    schema: { example: { id: 1, email: "user@example.com" } },
  })
  @ApiResponse({ status: 409, description: "Email already in use" })
  async signup(@Body() signUpDto: SignUpDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/signup", "POST", signUpDto);
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  @ApiOperation({ summary: "Generate new access/refresh token from validated user" })
  @ApiResponse({ status: 200, description: "Tokens refreshed", schema: { example: { accessToken: "<jwt>" } } })
  @ApiUnauthorizedResponse({ description: "Invalid refresh token" })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/refresh", "POST", refreshTokenDto);
  }

  @Post("oauth/google")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: OAuthDto })
  @ApiOperation({ summary: "Authenticate using Google OAuth2 token" })
  @ApiResponse({ status: 200, description: "Authenticated via Google", schema: { example: { accessToken: "<jwt>" } } })
  async googleOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/google", "POST", oauthDto);
  }

  @Post("oauth/microsoft")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: OAuthDto })
  @ApiOperation({ summary: "Authenticate using Microsoft OAuth2 token" })
  @ApiResponse({
    status: 200,
    description: "Authenticated via Microsoft",
    schema: { example: { accessToken: "<jwt>" } },
  })
  async microsoftOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/microsoft", "POST", oauthDto);
  }
}
