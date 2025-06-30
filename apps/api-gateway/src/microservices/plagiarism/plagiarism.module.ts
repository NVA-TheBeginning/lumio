import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { PlagiarismController } from "./plagiarism.controller.js";

@Module({
  imports: [ConfigModule, MicroserviceProxyModule],
  controllers: [PlagiarismController],
})
export class PlagiarismModule {}
