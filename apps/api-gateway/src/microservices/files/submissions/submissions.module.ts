import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "@/jwt/jwt.strategy.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { SubmissionsController } from "./submissions.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [SubmissionsController],
  providers: [JwtStrategy],
})
export class SubmissionsModule {}
