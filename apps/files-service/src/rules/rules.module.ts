import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";
import { DeliverableRulesController } from "./rules.controller";
import { DeliverableRulesService } from "./rules.service";

@Module({
  controllers: [DeliverableRulesController],
  providers: [PrismaService, S3Service, DeliverableRulesService],
})
export class RulesModule {}
