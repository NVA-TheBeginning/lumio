import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export interface JwtUser {
  sub: number;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

type RequestWithUser = FastifyRequest & { user: JwtUser };

export const GetUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtUser => {
      const req = ctx.switchToHttp().getRequest<RequestWithUser>();
      return req.user;
    },
);