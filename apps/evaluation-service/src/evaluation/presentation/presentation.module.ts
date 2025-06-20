import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { PresentationController } from "./presentation.controller";
import { PresentationService } from "./presentation.service";

@Module({
  controllers: [PresentationController],
  providers: [PresentationService, PrismaService],
  exports: [PresentationService],
})
export class PresentationModule {}
