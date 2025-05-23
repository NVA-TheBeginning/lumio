import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "@/jwt/jwt.strategy.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { DeliverablesController } from "./deliverables.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [DeliverablesController],
  providers: [JwtStrategy],
})
export class DeliverablesModule {}
