import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule } from "@nestjs/config";

import { AuthController } from "./auth.controller.js";
import { JwtStrategy } from "@/jwt/jwt.strategy.js";
import { JwtRefreshStrategy } from "@/jwt/jwt-refresh.strategy.js";
import {MicroserviceProxyModule} from "@/proxies/microservice-proxy.module.js";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    MicroserviceProxyModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
