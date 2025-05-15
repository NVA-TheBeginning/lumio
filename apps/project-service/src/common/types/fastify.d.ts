import "fastify";
import { JwtUser } from "@/common/decorators/get-user.decorator";

declare module "fastify" {
  interface FastifyRequest {
    user: JwtUser;
  }
}
