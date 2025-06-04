import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { AuthController } from "./auth.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, MicroserviceProxyModule],
  controllers: [AuthController],
})
export class AuthModule {}
