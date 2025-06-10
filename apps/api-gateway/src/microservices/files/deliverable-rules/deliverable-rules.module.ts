import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { DeliverableRulesController } from "./deliverable-rules.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [DeliverableRulesController],
})
export class DeliverableRulesModule {}
