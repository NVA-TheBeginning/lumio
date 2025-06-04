import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export interface JwtUser {
  sub: number;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export const JwtUser = null as unknown as JwtUser;

export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser | null => {
  const req = ctx.switchToHttp().getRequest<FastifyRequest & { user?: JwtUser }>();
  if (req.user) {
    return req.user;
  }
  const header = req.headers["x-user"];
  if (header) {
    try {
      return JSON.parse(header as string) as JwtUser;
    } catch (_error) {
      // Handle JSON parsing error gracefully
      return null;
    }
  }
  return null;
});
