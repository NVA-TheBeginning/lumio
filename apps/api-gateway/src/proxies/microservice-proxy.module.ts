import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MicroserviceProxyService } from "./microservice-proxy.service.js";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MicroserviceProxyService],
  exports: [MicroserviceProxyService],
})
export class MicroserviceProxyModule {}
