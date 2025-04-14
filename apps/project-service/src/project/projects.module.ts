import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { ProjectController } from "./projects.controller";
import { ProjectService } from "./projects.service";

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService],
  exports: [ProjectService],
})
export class ProjectsModule {}
