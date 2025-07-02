import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";
import { RuleValidationService } from "./rule-validation.service";
import { DeliverableRulesController } from "./rules.controller";
import { DeliverableRulesService } from "./rules.service";

@Module({
  controllers: [DeliverableRulesController],
  providers: [PrismaService, S3Service, DeliverableRulesService, RuleValidationService],
  exports: [RuleValidationService], // Export so it can be used in submissions module
})
export class RulesModule {}
