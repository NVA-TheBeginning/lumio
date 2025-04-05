import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface LoginDto extends Record<string, unknown> {
  email: string;
  password: string;
}

interface RefreshTokenDto extends Record<string, unknown> {
  refreshToken: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.proxy.forwardRequest("auth", "/auth/login", "POST", loginDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.proxy.forwardRequest("auth", "/auth/refresh", "POST", refreshDto);
  }
}
