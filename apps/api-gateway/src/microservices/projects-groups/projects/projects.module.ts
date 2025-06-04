import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { GroupsController } from "@/microservices/projects-groups/groups/groups.controller.js";
import { ProjectsService } from "@/microservices/projects-groups/projects/projects.service.js";
import { MicroserviceProxyModule } from "@/proxies/microservice-proxy.module.js";
import { PromotionsController } from "../promotions/promotions.controller.js";
import { PromotionsService } from "../promotions/promotions.service.js";
import { ProjectsController } from "./projects.controller.js";

@Module({
  imports: [ConfigModule, JwtModule.register({}), MicroserviceProxyModule],
  controllers: [PromotionsController, ProjectsController, GroupsController],
  providers: [PromotionsService, ProjectsService],
})
export class ProjectsModule {}
