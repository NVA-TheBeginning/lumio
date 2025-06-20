import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { OrderController } from "./order.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [OrderController],
})
export class OrderModule {}
