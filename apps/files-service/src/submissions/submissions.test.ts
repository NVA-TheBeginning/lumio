import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { File } from "@nest-lab/fastify-multer";
import { BadRequestException } from "@nestjs/common";
import { DeliverableType } from "@prisma-files/client";
import type { PrismaService } from "@/prisma.service";
import type { S3Service } from "@/s3.service";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

const mockFile = {
  fieldname: "file",
  originalname: "test.zip",
  encoding: "7bit",
  mimetype: "application/zip",
  size: 1024,
  buffer: Buffer.from("test data"),
  stream: null,
  destination: "",
  filename: "test.zip",
  path: "",
};

describe("SubmissionsController", () => {
  let controller: SubmissionsController;
  let submissionsService: SubmissionsService;
  let s3Service: S3Service;
  let prismaService: PrismaService;

  const mockS3Service = {
    uploadFile: mock(),
    deleteFile: mock(),
    getFile: mock(),
    generateFileKey: mock().mockReturnValue("mocked-file-key"),
    uploadZipSubmission: mock().mockResolvedValue("mocked-zip-key"),
    uploadGitSubmission: mock().mockResolvedValue("mocked-git-key"),
    checkForbiddenFiles: mock().mockResolvedValue(false),
    getFileMetadata: mock(),
    extractFileName: mock(),
  };

  const mockPrismaService = {
    deliverables: {
      findUnique: mock(),
      findUniqueOrThrow: mock(),
    },
    submissions: {
      create: mock(),
      findMany: mock(),
      findUnique: mock(),
      findUniqueOrThrow: mock(),
      delete: mock(),
    },
  };

  beforeEach(async () => {
    mockS3Service.getFileMetadata.mockReset();
    mockS3Service.getFile.mockReset();
    mockS3Service.deleteFile.mockReset();
    mockPrismaService.submissions.findMany.mockReset();
    mockPrismaService.submissions.findUniqueOrThrow.mockReset();
    mockPrismaService.submissions.delete.mockReset();
    mockPrismaService.deliverables.findUnique.mockReset();
    mockPrismaService.deliverables.findUniqueOrThrow.mockReset();

    s3Service = mockS3Service as unknown as S3Service;
    prismaService = mockPrismaService as unknown as PrismaService;
    submissionsService = new SubmissionsService(prismaService, s3Service);
    controller = new SubmissionsController(submissionsService);
  });

  describe("submit", () => {
    test("should throw BadRequestException when no file is provided", async () => {
      let error: Error | null = null;
      try {
        await controller.submit(1, 123, null as unknown as File);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
    });

    test("should throw BadRequestException when file has no buffer", async () => {
      const fileWithoutBuffer = { ...mockFile, buffer: undefined };

      let error: Error | null = null;
      try {
        await controller.submit(1, 123, fileWithoutBuffer as unknown as File);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
    });

    test("should throw BadRequestException for invalid Git URL format", async () => {
      const mockDeliverable = {
        id: 1,
        projectId: 100,
        promotionId: 200,
        type: [DeliverableType.GIT],
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        allowLateSubmission: true,
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);

      const invalidGitUrl = "this-is-not-a-valid-git-url";

      expect(() => controller.submit(1, 123, mockFile as unknown as File, invalidGitUrl)).toThrow(BadRequestException);
      expect(mockPrismaService.deliverables.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should apply penalty for late submissions with GIT type", async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 5);

      const mockDeliverable = {
        id: 1,
        projectId: 100,
        promotionId: 200,
        type: [DeliverableType.GIT],
        deadline: pastDate,
        allowLateSubmission: true,
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "LATE",
        penalty: 5,
        gitUrl: "https://github.com/test/test",
        submissionDate: new Date(),
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.create.mockResolvedValue(mockSubmission);

      await controller.submit(1, 123, undefined, "https://github.com/test/test");

      expect(mockPrismaService.submissions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "LATE",
          penalty: expect.any(Number),
          gitUrl: "https://github.com/test/test",
        }),
      });
    });

    test("should throw BadRequestException when late submission is not allowed", async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 5);

      const mockDeliverable = {
        id: 1,
        projectId: 100,
        promotionId: 200,
        type: DeliverableType.FILE,
        deadline: pastDate,
        allowLateSubmission: false,
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);

      let error: Error | null = null;
      try {
        await controller.submit(1, 123, mockFile as unknown as File);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("Late submission is not allowed");
    });
  });

  describe("find all submissions of a group", () => {
    test("should return all submissions for a group", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-file-key-1",
          submissionDate: new Date("2025-06-15T10:00:00Z"),
          deliverable: {
            type: [DeliverableType.FILE],
          },
        },
        {
          id: 2,
          deliverableId: 2,
          groupId: 123,
          status: "LATE",
          penalty: 5,
          fileUrl: "mocked-file-key-2",
          submissionDate: new Date("2025-06-14T14:30:00Z"),
          deliverable: {
            type: [DeliverableType.FILE],
          },
        },
      ];

      const expectedResponse = [
        {
          submissionId: 1,
          deliverableId: 1,
          fileKey: "mocked-file-key-1",
          fileName: "mocked-file-key-1",
          mimeType: "application/zip",
          fileSize: 1024,
          submissionDate: new Date("2025-06-15T10:00:00Z"),
          groupId: 123,
          penalty: 0,
          type: [DeliverableType.FILE],
          status: "PASSED",
          lastModified: new Date("2025-06-15T10:00:00Z"),
        },
        {
          submissionId: 2,
          deliverableId: 2,
          fileKey: "mocked-file-key-2",
          fileName: "mocked-file-key-2",
          mimeType: "application/zip",
          fileSize: 2048,
          submissionDate: new Date("2025-06-14T14:30:00Z"),
          groupId: 123,
          penalty: 5,
          type: [DeliverableType.FILE],
          status: "LATE",
          lastModified: new Date("2025-06-14T14:30:00Z"),
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockS3Service.getFileMetadata
        .mockResolvedValueOnce({
          size: 1024,
          lastModified: new Date("2025-06-15T10:00:00Z"),
          contentType: "application/zip",
        })
        .mockResolvedValueOnce({
          size: 2048,
          lastModified: new Date("2025-06-14T14:30:00Z"),
          contentType: "application/zip",
        });

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 123,
          fileUrl: { not: null },
        },
        orderBy: { submissionDate: "desc" },
        include: {
          deliverable: {
            select: { type: true },
          },
        },
      });
      expect(mockS3Service.getFileMetadata).toHaveBeenCalledTimes(2);
    });

    test("should return empty array when group has no submissions", async () => {
      mockPrismaService.submissions.findMany.mockResolvedValue([]);

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual([]);
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 123,
          fileUrl: { not: null },
        },
        orderBy: { submissionDate: "desc" },
        include: {
          deliverable: {
            select: { type: true },
          },
        },
      });
    });

    test("should filter by deliverable ID when provided", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-file-key-1",
          submissionDate: new Date("2025-06-15T10:00:00Z"),
          deliverable: {
            type: [DeliverableType.FILE],
          },
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockS3Service.getFileMetadata.mockResolvedValue({
        size: 1024,
        lastModified: new Date("2025-06-15T10:00:00Z"),
        contentType: "application/zip",
      });

      const result = await controller.findAllByDeliverable(123, 1);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 123,
          deliverableId: 1,
          fileUrl: { not: null },
        },
        orderBy: { submissionDate: "desc" },
        include: {
          deliverable: {
            select: { type: true },
          },
        },
      });
    });

    test("should handle S3 metadata errors gracefully", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-file-key",
          submissionDate: new Date(),
          deliverable: {
            type: [DeliverableType.FILE],
          },
        },
      ];

      const expectedResponse = [
        {
          submissionId: 1,
          deliverableId: 1,
          fileKey: "",
          fileName: "",
          mimeType: "application/zip",
          fileSize: 0,
          submissionDate: mockSubmissions[0].submissionDate,
          groupId: 123,
          penalty: 0,
          type: [DeliverableType.FILE],
          status: "PASSED",
          lastModified: mockSubmissions[0].submissionDate,
          error: true,
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockS3Service.getFileMetadata.mockRejectedValue(new Error("S3 error"));

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual(expectedResponse);
    });

    test("should handle submissions with different deliverable types", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-file-key",
          submissionDate: new Date(),
          deliverable: {
            type: [DeliverableType.GIT],
          },
        },
      ];

      const expectedResponse = [
        {
          submissionId: 1,
          deliverableId: 1,
          fileKey: "mocked-file-key",
          fileName: "mocked-file-key",
          mimeType: "application/zip",
          fileSize: 1024,
          submissionDate: mockSubmissions[0].submissionDate,
          groupId: 123,
          penalty: 0,
          type: [DeliverableType.GIT],
          status: "PASSED",
          lastModified: new Date("2025-06-15T10:00:00Z"),
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockS3Service.getFileMetadata.mockResolvedValue({
        size: 1024,
        lastModified: new Date("2025-06-15T10:00:00Z"),
        contentType: "application/zip",
      });

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual(expectedResponse);
      expect(result[0].type).toEqual([DeliverableType.GIT]);
    });
  });

  describe("findOne", () => {
    test("should get a specific submission file", async () => {
      const mockSubmission = {
        fileUrl: "uploads/2025/test-file.zip",
      };

      const mockFileResponse = {
        buffer: Buffer.from("test data"),
        fileName: "test-file.zip",
        mimeType: "application/zip",
      };

      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.findOne(1);

      expect(result.buffer).toEqual(mockFileResponse.buffer);
      expect(result.mimeType).toEqual(mockFileResponse.mimeType);
      expect(result.fileName).toBeDefined();
      expect(mockPrismaService.submissions.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          fileUrl: true,
        },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
    });

    test("should throw error when submission doesn't exist", async () => {
      const error = new Error("Record not found");
      mockPrismaService.submissions.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.findOne(1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should throw BadRequestException when fileUrl is missing", async () => {
      const mockSubmission = {
        fileUrl: null,
      };

      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);

      let error: Error | null = null;
      try {
        await controller.findOne(1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("File URL is missing for submission");
    });

    test("should throw BadRequestException when file download fails", async () => {
      const mockSubmission = {
        fileUrl: "mocked-zip-key",
      };

      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockS3Service.getFile.mockRejectedValue(new Error("S3 error"));

      let error: Error | null = null;
      try {
        await controller.findOne(1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("File not found for submission");
    });
  });

  describe("deleteSubmission", () => {
    test("should delete a submission", async () => {
      const mockSubmission = {
        id: 1,
        fileUrl: "mocked-zip-key",
      };

      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await controller.deleteSubmission(1);

      expect(mockPrismaService.submissions.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should throw error when submission doesn't exist", async () => {
      const error = new Error("Record not found");
      mockPrismaService.submissions.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.deleteSubmission(1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should handle submission with missing fileUrl", async () => {
      const mockSubmission = {
        id: 1,
        fileUrl: null,
      };

      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});

      await controller.deleteSubmission(1);

      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
    });
  });
});
