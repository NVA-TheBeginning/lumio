import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { ReportsController } from "./reports.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
