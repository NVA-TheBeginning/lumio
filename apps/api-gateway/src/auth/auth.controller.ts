// src/auth/auth.controller.ts
import { Body, Controller, Post, Request, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { AuthService } from "@/auth/auth.service.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint pour la connexion.
   * Expects a payload with email and password.
   */
  @Post("login")
  @ApiOperation({
    summary: "User login",
    description: "Authenticate a user and return an access token and a refresh token.",
  })
  @ApiBody({
    description: "User credentials",
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        password: { type: "string", example: "password123" },
      },
      required: ["email", "password"],
    },
  })
  @ApiResponse({ status: 200, description: "Returns an access token and a refresh token." })
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Identifiants invalides");
    }
    return this.authService.login(user);
  }

  /**
   * Endpoint pour le refresh token.
   * Protégé par AuthGuard pour s'assurer que le refresh token est fourni.
   */
  @Post("refresh")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({
    summary: "Refresh token",
    description: "Refresh the access token using a valid refresh token.",
  })
  @ApiBody({
    description: "Payload containing the refresh token",
    schema: {
      type: "object",
      properties: {
        refreshToken: { type: "string", example: "yourRefreshToken" },
      },
      required: ["refreshToken"],
    },
  })
  @ApiResponse({ status: 200, description: "Returns a new access token." })
  async refresh(@Request() req: FastifyRequest, @Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
