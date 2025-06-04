import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { AuthController } from "./auth.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [AuthController],
})
export class AuthModule {}
