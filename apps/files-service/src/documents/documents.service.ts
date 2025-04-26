import type { File } from "@nest-lab/fastify-multer";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";

export interface GetDocumentResponse {
  file: Buffer;
  key: string;
  mimeType: string;
  ownerId: number;
  sizeInBytes: number;
}

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async uploadDocument(file: File, name: string, ownerId: number) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    try {
      const fileKey = this.s3Service.generateFileKey(file.filename || file.originalname);
      if (!file.buffer) {
        throw new BadRequestException("File buffer or data is required");
      }
      const buffer = file.buffer;
      await this.s3Service.uploadFile(buffer, fileKey);

      const document = await this.prisma.documents.create({
        data: {
          name: name,
          ownerId: Number(ownerId),
          fileKey,
          sizeInBytes: file.size || 0,
          mimeType: file.mimetype,
        },
      });

      return document;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new BadRequestException("Failed to upload document");
    }
  }

  async getDocumentsByOwner(ownerId: number) {
    return this.prisma.documents.findMany({
      where: {
        ownerId: Number(ownerId),
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });
  }

  async getDocumentById(id: number): Promise<GetDocumentResponse> {
    const doc = await this.prisma.documents.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        fileKey: true,
        mimeType: true,
        ownerId: true,
        sizeInBytes: true,
      },
    });

    if (!doc?.fileKey) {
      throw new BadRequestException("Document not found or not authorized");
    }
    const file = await this.s3Service.getFile(doc.fileKey);

    if (!file) {
      throw new BadRequestException("File not found");
    }

    return {
      file,
      key: doc.fileKey,
      mimeType: doc.mimeType,
      ownerId: doc.ownerId,
      sizeInBytes: doc.sizeInBytes,
    };
  }

  async deleteDocument(id: number) {
    const document = await this.prisma.documents.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!document) {
      throw new BadRequestException("Document not found or not authorized");
    }

    await this.s3Service.deleteFile(document.fileKey);

    await this.prisma.documents.delete({
      where: {
        id: Number(id),
      },
    });

    return { success: true };
  }
}
