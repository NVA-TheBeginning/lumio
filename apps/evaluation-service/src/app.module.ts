import { Module } from "@nestjs/common";
import { CriteriaModule } from "@/evaluation/criteria/criteria.module";
import { FinalGradeModule } from "@/evaluation/final-grade/final-grade.module";
import { GradeModule } from "@/evaluation/grade/grade.module";
import { OrderModule } from "@/evaluation/order/order.module";
import { PresentationModule } from "@/evaluation/presentation/presentation.module";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, PresentationModule, OrderModule, CriteriaModule, GradeModule, FinalGradeModule],
})
export class AppModule {}
