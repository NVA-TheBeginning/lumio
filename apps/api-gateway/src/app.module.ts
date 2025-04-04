// src/app.module.ts
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { RouterModule } from "nest-router";
import { AuthModule } from "@/auth/auth.module.js";
import { HealthModule } from "@/health/health.module.js";

@Module({
  imports: [AuthModule, HealthModule],
})
export class AppModule {}
