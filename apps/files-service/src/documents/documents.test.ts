import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { File } from "@nest-lab/fastify-multer";
import { BadRequestException } from "@nestjs/common";
import { DocumentController } from "@/documents/documents.controller";
import { DocumentService, GetDocumentResponse } from "@/documents/documents.service";
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
    getFile: mock(),
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

      expect(mockS3Service.generateFileKey).toHaveBeenCalledWith(mockFile.filename || mockFile.originalname);
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

    test("should throw BadRequestException when no file is provided", async () => {
      expect(controller.uploadDocument(null as unknown as File, "Test Document", 123)).rejects.toThrow(
        BadRequestException,
      );
    });

    test("should handle errors during upload", async () => {
      mockS3Service.uploadFile.mockRejectedValue(new Error("Upload failed"));

      expect(controller.uploadDocument(mockFile as unknown as File, "Test Document", 123)).rejects.toThrow(
        BadRequestException,
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
      const mockDocumentData = {
        fileKey: "mocked-file-key",
        mimeType: "application/pdf",
        ownerId: 123,
        sizeInBytes: 1024,
      };

      const mockDocument: GetDocumentResponse = {
        file: Buffer.from("test data"),
        key: "mocked-file-key",
        mimeType: "application/pdf",
        ownerId: 123,
        sizeInBytes: 1024,
      };

      mockPrismaService.documents.findUnique.mockResolvedValue(mockDocumentData);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.getDocument(1);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.documents.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          fileKey: true,
          mimeType: true,
          ownerId: true,
          sizeInBytes: true,
        },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledWith("mocked-file-key");
    });

    test("should throw BadRequestException if document is not found", async () => {
      mockPrismaService.documents.findUnique.mockResolvedValue(null);

      expect(controller.getDocument(1)).rejects.toThrow(BadRequestException);
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

      expect(controller.deleteDocument(1)).rejects.toThrow(BadRequestException);

      setTimeout(() => {
        expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
        expect(mockPrismaService.documents.delete).not.toHaveBeenCalled();
      }, 0);
    });
  });
});
