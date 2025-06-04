import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import { jwtConstants } from "@/config/constants.js";

type UserReq = {
  sub: number;
  email: string;
  role: "TEACHER" | "STUDENT" | "ADMIN" | string;
  type: string;
  iat?: number;
  exp?: number;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: UserReq;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      new Logger("AuthGuard").error("No token provided in Authorization header");
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      request.user = payload;
    } catch (error) {
      new Logger("AuthGuard").error("Invalid token provided in Authorization header", error);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
