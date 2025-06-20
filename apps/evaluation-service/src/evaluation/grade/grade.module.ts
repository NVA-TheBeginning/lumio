import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { GradeController } from "./grade.controller";
import { GradeService } from "./grade.service";

@Module({
  controllers: [GradeController],
  providers: [GradeService, PrismaService],
  exports: [GradeService],
})
export class GradeModule {}
