import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { DocumentController } from "./documents.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [DocumentController],
})
export class FilesModule {}
