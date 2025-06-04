import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { DeliverablesController } from "./deliverables.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [DeliverablesController],
})
export class DeliverablesModule {}
