import { Module } from "@nestjs/common";
import { EmailModule } from "./email/email.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, EmailModule],
})
export class AppModule {}
