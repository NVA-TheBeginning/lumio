import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { PresentationController } from "./presentation.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [PresentationController],
})
export class PresentationModule {}
