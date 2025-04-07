import {Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards} from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import {AuthGuard} from "@nestjs/passport";

interface LoginDto extends Record<string, unknown> {
  email: string;
  password: string;
}

interface SignUpDto extends Record<string, unknown> {
  email: string;
  password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.proxy.forwardRequest("auth", "/auth/login", "POST", loginDto);
  }
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto) {
    return this.proxy.forwardRequest("auth", "/auth/signup", "POST", signUpDto);
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req : any) {
    const user = req.user;
    return this.proxy.forwardRequest("auth", "/auth/refresh", "POST", user);
  }
}