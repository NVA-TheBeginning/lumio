import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { DeliverablesController } from "./deliverables.controller";
import { DeliverablesService } from "./deliverables.service";

@Module({
  controllers: [DeliverablesController],
  providers: [DeliverablesService, PrismaService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
