import { Module } from "@nestjs/common";
import { OAuthModule } from "@/oauth/oauth.module";
import { AuthModule } from "./auth/auth.module.js";
import { HealthModule } from "./health/health.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [HealthModule, AuthModule, UsersModule, OAuthModule],
})
export class AppModule {}
