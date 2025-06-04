import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { SubmissionsController } from "./submissions.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
