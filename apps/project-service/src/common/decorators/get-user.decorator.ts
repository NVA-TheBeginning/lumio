import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export interface JwtUser {
  sub: number; // user ID
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser => {
  const req = ctx.switchToHttp().getRequest<FastifyRequest>();
  return req.user as JwtUser;
});
