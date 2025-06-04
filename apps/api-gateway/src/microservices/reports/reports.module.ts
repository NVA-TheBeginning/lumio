import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { ReportsController } from "./reports.controller.js";

@Module({
  imports: [ConfigModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
