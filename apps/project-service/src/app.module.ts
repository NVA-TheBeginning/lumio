import { Module } from "@nestjs/common";
import { GroupsModule } from "@/groups/groups.module";
import { HealthModule } from "./health/health.module.js";
import { ProjectsModule } from "./project/projects.module.js";
import { PromotionsModule } from "./promotions/promotions.module";

@Module({
  imports: [HealthModule, PromotionsModule, ProjectsModule, GroupsModule],
})
export class AppModule {}
