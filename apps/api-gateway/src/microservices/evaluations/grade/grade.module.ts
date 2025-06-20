import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GradeController } from "@/microservices/evaluations/grade/grade.controller.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [GradeController],
})
export class GradeModule {}
