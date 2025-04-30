import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "@/jwt/jwt.strategy.js";
import { JwtRefreshStrategy } from "@/jwt/jwt-refresh.strategy.js";
import { GroupsController } from "@/microservices/projects-groups/groups/groups.controller.js";
import { ProjectsService } from "@/microservices/projects-groups/projects/projects.service.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { PromotionsController } from "../promotions/promotions.controller.js";
import { PromotionsService } from "../promotions/promotions.service.js";
import { ProjectsController } from "./projects.controller.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [PromotionsController, ProjectsController, GroupsController],
  providers: [JwtStrategy, JwtRefreshStrategy, PromotionsService, ProjectsService],
})
export class ProjectsModule {}
