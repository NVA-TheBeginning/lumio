import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { UsersController } from "./users.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [UsersController],
})
export class UsersModule {}
