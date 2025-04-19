import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { File } from "@nest-lab/fastify-multer";
import { BadRequestException } from "@nestjs/common";
import { DocumentController } from "@/documents/documents.controller";
import { DocumentService } from "@/documents/documents.service";
import type { PrismaService } from "@/prisma.service";
import type { S3Service } from "@/s3.service";

const mockFile = {
  fieldname: "file",
  originalname: "test.pdf",
  encoding: "7bit",
  mimetype: "application/pdf",
  size: 1024,
  buffer: Buffer.from("test data"),
  stream: null,
  destination: "",
  filename: "test.pdf",
  path: "",
};

describe("DocumentController", () => {
  let controller: DocumentController;
  let documentService: DocumentService;
  let s3Service: S3Service;
  let prismaService: PrismaService;

  const mockS3Service = {
    uploadFile: mock(),
    deleteFile: mock(),
    generateFileKey: mock().mockReturnValue("mocked-file-key"),
  };

  const mockPrismaService = {
    documents: {
      create: mock(),
      findMany: mock(),
      findUnique: mock(),
      delete: mock(),
    },
  };

  beforeEach(async () => {
    s3Service = mockS3Service as unknown as S3Service;
    prismaService = mockPrismaService as unknown as PrismaService;
    documentService = new DocumentService(prismaService, s3Service);

    controller = new DocumentController(documentService);
  });

  afterEach(() => {
    mockS3Service.uploadFile.mockReset();
    mockS3Service.deleteFile.mockReset();
    mockS3Service.generateFileKey.mockReset();
    mockPrismaService.documents.create.mockReset();
    mockPrismaService.documents.findMany.mockReset();
    mockPrismaService.documents.findUnique.mockReset();
    mockPrismaService.documents.delete.mockReset();
  });

  describe("uploadDocument", () => {
    test("should upload a document successfully", async () => {
      const mockDocument = {
        id: 1,
        name: "Test Document",
        ownerId: 123,
        fileKey: "mocked-file-key",
        sizeInBytes: 1024,
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      mockPrismaService.documents.create.mockResolvedValue(mockDocument);
      mockS3Service.uploadFile.mockResolvedValue(undefined);

      const result = await controller.uploadDocument(mockFile as unknown as File, "Test Document", 123);

      expect(result).toEqual(mockDocument);

      expect(mockS3Service.generateFileKey).toHaveBeenCalledWith(mockFile.originalname);
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile.buffer, "mocked-file-key");
      expect(mockPrismaService.documents.create).toHaveBeenCalledWith({
        data: {
          name: "Test Document",
          ownerId: 123,
          fileKey: "mocked-file-key",
          sizeInBytes: 1024,
          mimeType: "application/pdf",
        },
      });
    });

    test("should handle errors during upload", async () => {
      mockS3Service.uploadFile.mockRejectedValue(new Error("Upload failed"));

      expect(controller.uploadDocument(mockFile as unknown as File, "Test Document", 123)).rejects.toThrowError(
        new BadRequestException("Failed to upload document"),
      );
    });
  });

  describe("getDocuments", () => {
    test("should get all documents for a user", async () => {
      const mockDocuments = [
        {
          id: 1,
          name: "Test Document 1",
          ownerId: 123,
          fileKey: "mocked-file-key-1",
          sizeInBytes: 1024,
          mimeType: "application/pdf",
          uploadedAt: new Date(),
        },
        {
          id: 2,
          name: "Test Document 2",
          ownerId: 123,
          fileKey: "mocked-file-key-2",
          sizeInBytes: 2048,
          mimeType: "application/pdf",
          uploadedAt: new Date(),
        },
      ];

      mockPrismaService.documents.findMany.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments(123);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.documents.findMany).toHaveBeenCalledWith({
        where: { ownerId: 123 },
        orderBy: { uploadedAt: "desc" },
      });
    });
  });

  describe("getDocument", () => {
    test("should get a document by ID", async () => {
      const mockDocument = {
        id: 1,
        name: "Test Document",
        ownerId: 123,
        fileKey: "mocked-file-key",
        sizeInBytes: 1024,
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      mockPrismaService.documents.findUnique.mockResolvedValue(mockDocument);

      const result = await controller.getDocument(1);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.documents.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should throw BadRequestException if document is not found", async () => {
      mockPrismaService.documents.findUnique.mockResolvedValue(null);

      expect(controller.getDocument(1)).rejects.toThrowError(new BadRequestException("Document not found"));
    });
  });

  describe("deleteDocument", () => {
    test("should delete a document by ID", async () => {
      const mockDocument = {
        id: 1,
        name: "Test Document",
        ownerId: 123,
        fileKey: "mocked-file-key",
        sizeInBytes: 1024,
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      mockPrismaService.documents.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documents.delete.mockResolvedValue({});
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      const result = await controller.deleteDocument(1);

      expect(result).toEqual({ success: true });
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith("mocked-file-key");
      expect(mockPrismaService.documents.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should throw BadRequestException if document is not found for deletion", async () => {
      mockPrismaService.documents.findUnique.mockResolvedValue(null);

      expect(controller.deleteDocument(1)).rejects.toThrowError(
        new BadRequestException("Document not found or not authorized"),
      );
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(mockPrismaService.documents.delete).not.toHaveBeenCalled();
    });
  });
});
