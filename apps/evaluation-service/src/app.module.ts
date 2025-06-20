import { Module } from "@nestjs/common";
import { GradeModule } from "@/evaluation/grade/grade.module";
import { OrderModule } from "@/evaluation/order/order.module";
import { PresentationModule } from "@/evaluation/presentation/presentation.module";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, PresentationModule, OrderModule, GradeModule],
})
export class AppModule {}
