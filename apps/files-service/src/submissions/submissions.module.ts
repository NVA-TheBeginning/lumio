import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

@Module({
  controllers: [SubmissionsController],
  providers: [PrismaService, S3Service, SubmissionsService],
})
export class SubmissionsModule {}
