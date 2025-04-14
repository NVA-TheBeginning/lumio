import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "@/jwt/jwt.strategy.js";
import { JwtRefreshStrategy } from "@/jwt/jwt-refresh.strategy.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { ProjectsController } from "./projects.controller.js";
import { PromotionsController } from "./promotions.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [PromotionsController, ProjectsController],
  providers: [JwtStrategy, JwtRefreshStrategy],
})
export class ProjectsModule {}
