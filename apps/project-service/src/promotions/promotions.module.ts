import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PrismaService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
