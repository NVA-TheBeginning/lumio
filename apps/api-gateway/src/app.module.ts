import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { HealthController } from "@/health/health.controller.js";
import { AuthModule } from "@/microservices/auth/auth.module.js";
import { CriteriaModule } from "@/microservices/evaluations/criteria/criteria.module.js";
import { FinalGradeModule } from "@/microservices/evaluations/final-grade/final-grade.module.js";
import { GradeModule } from "@/microservices/evaluations/grade/grade.module.js";
import { OrderModule } from "@/microservices/evaluations/order/order.module.js";
import { ProjectsModule } from "@/microservices/projects-groups/projects/projects.module.js";
import configuration from "./config/configuration.js";
import { UsersModule } from "./microservices/auth/users/users.module.js";
import { PresentationModule } from "./microservices/evaluations/presentation/presentation.module.js";
import { DeliverableRulesModule } from "./microservices/files/deliverable-rules/deliverable-rules.module.js";
import { DeliverablesModule } from "./microservices/files/deliverables/deliverables.module.js";
import { FilesModule } from "./microservices/files/files.module.js";
import { SubmissionsModule } from "./microservices/files/submissions/submissions.module.js";
import { PlagiarismModule } from "./microservices/plagiarism/plagiarism.module.js";
import { ReportsModule } from "./microservices/reports/reports.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 600000, // 10 minutes in milliseconds
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    FilesModule,
    SubmissionsModule,
    DeliverablesModule,
    DeliverableRulesModule,
    ReportsModule,
    PlagiarismModule,
    PresentationModule,
    OrderModule,
    CriteriaModule,
    GradeModule,
    FinalGradeModule,
    JwtModule.register({}),
    PrometheusModule.register({
      path: "/metrics",
      defaultLabels: {
        app: "Lumio API Gateway",
      },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
