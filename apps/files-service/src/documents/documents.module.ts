import { FastifyMulterModule } from "@nest-lab/fastify-multer";
import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";
import { DocumentController } from "./documents.controller";
import { DocumentService } from "./documents.service";

@Module({
  controllers: [DocumentController],
  imports: [FastifyMulterModule],
  providers: [PrismaService, S3Service, DocumentService],
})
export class DocumentsModule {}
