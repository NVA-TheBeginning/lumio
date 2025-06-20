import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CriteriaController } from "@/microservices/evaluations/criteria/criteria.controller.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [CriteriaController],
})
export class CriteriaModule {}
