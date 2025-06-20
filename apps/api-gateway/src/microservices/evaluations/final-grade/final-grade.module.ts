import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FinalGradeController } from "@/microservices/evaluations/final-grade/final-grade.controller.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [FinalGradeController],
})
export class FinalGradeModule {}
