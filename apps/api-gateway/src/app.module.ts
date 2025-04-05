// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "@/health/health.controller.js";

import { AuthModule } from "@/microservices/auth/auth.module.js";
import configuration from "./config/configuration.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
