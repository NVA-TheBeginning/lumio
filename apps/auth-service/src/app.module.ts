import { Module } from "@nestjs/common";
import { OAuthModule } from "@/oauth/oauth.module";
import { AuthModule } from "./auth/auth.module.js";
import { HealthModule } from "./health/health.module.js";
import { StudentsModule } from "./students/students.module";

@Module({
  imports: [HealthModule, AuthModule, StudentsModule, OAuthModule],
})
export class AppModule {}
