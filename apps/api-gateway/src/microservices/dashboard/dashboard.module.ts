import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { DashboardController } from "./dashboard.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
