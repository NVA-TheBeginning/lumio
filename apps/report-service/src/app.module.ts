import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { ReportsModule } from "./reports/reports.module.js";

@Module({
  imports: [HealthModule, ReportsModule],
})
export class AppModule {}
