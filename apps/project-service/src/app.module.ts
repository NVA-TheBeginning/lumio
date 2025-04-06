import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { PromotionsModule } from "./promotions/promotions.module";

@Module({
  imports: [HealthModule, PromotionsModule],
})
export class AppModule {}
