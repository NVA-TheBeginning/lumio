import { Module } from "@nestjs/common";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma.service.js";
import { OAuthController } from "./oauth.controller.js";
import { OAuthService } from "./oauth.service.js";

@Module({
  controllers: [OAuthController],
  providers: [OAuthService, AuthService, PrismaService],
})
export class OAuthModule {}
