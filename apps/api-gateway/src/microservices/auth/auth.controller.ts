import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { FastifyRequest } from "fastify";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface LoginDto extends Record<string, unknown> {
  email: string;
  password: string;
}

interface SignUpDto extends Record<string, unknown> {
  email: string;
  password: string;
}

export interface OAuthDto extends Record<string, unknown> {
  token: string;
}

export interface JwtRefreshUser extends Record<string, unknown> {
  id: number;
  email: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/login", "POST", loginDto);
  }
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/signup", "POST", signUpDto);
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: FastifyRequest & { refreshToken: string }): Promise<unknown> {
    const { refreshToken } = req;
    return this.proxy.forwardRequest("auth", "/auth/refresh", "POST", { refreshToken });
  }

  @Post("oauth/google")
  @HttpCode(HttpStatus.OK)
  async googleOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/google", "POST", oauthDto);
  }

  @Post("oauth/microsoft")
  @HttpCode(HttpStatus.OK)
  async microsoftOAuth(@Body() oauthDto: OAuthDto): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/auth/oauth/microsoft", "POST", oauthDto);
  }
}
