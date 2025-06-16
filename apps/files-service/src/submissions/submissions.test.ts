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
        },
        {
          id: 2,
          deliverableId: 2,
          groupId: 123,
          status: "LATE",
          penalty: 5,
          fileUrl: "mocked-file-key-2",
          submissionDate: new Date("2025-06-14T14:30:00Z"),
        },
      ];

      const mockDeliverable = {
        id: 1,
        type: [DeliverableType.FILE],
      };

      const expectedResponse = [
        {
          submissionId: 1,
          deliverableId: 1,
          fileKey: "mocked-file-key-1",
          mimeType: "application/zip",
          buffer: Buffer.from("test data 1"),
          submissionDate: new Date("2025-06-15T10:00:00Z"),
          groupId: 123,
          penalty: 0,
          type: [DeliverableType.FILE],
          status: "PASSED",
        },
        {
          submissionId: 2,
          deliverableId: 2,
          fileKey: "mocked-file-key-2",
          mimeType: "application/zip",
          buffer: Buffer.from("test data 2"),
          submissionDate: new Date("2025-06-14T14:30:00Z"),
          groupId: 123,
          penalty: 5,
          type: [DeliverableType.FILE],
          status: "LATE",
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockS3Service.getFile
        .mockResolvedValueOnce(Buffer.from("test data 1"))
        .mockResolvedValueOnce(Buffer.from("test data 2"));

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: { groupId: 123 },
        orderBy: { submissionDate: "desc" },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledTimes(2);
      expect(mockS3Service.getFile).toHaveBeenCalledWith("mocked-file-key-1");
      expect(mockS3Service.getFile).toHaveBeenCalledWith("mocked-file-key-2");
    });

    test("should return empty array when group has no submissions", async () => {
      mockPrismaService.submissions.findMany.mockResolvedValue([]);

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual([]);
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: { groupId: 123 },
        orderBy: { submissionDate: "desc" },
      });
    });

    test("should throw BadRequestException when submission has missing fileUrl", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: null,
          submissionDate: new Date(),
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);

      let error: Error | null = null;
      try {
        await controller.findAllByDeliverable(123);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("File not found for submission");
    });

    test("should throw BadRequestException when file retrieval fails", async () => {
      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-file-key",
          submissionDate: new Date(),
        },
      ];

      const mockDeliverable = {
        id: 1,
        type: [DeliverableType.FILE],
      };

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockS3Service.getFile.mockRejectedValue(new Error("S3 error"));

      let error: Error | null = null;
      try {
        await controller.findAllByDeliverable(123);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("File not found for submission");
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
        },
      ];

      const mockDeliverable = {
        id: 1,
        type: [DeliverableType.GIT],
      };

      const expectedResponse = [
        {
          submissionId: 1,
          deliverableId: 1,
          fileKey: "mocked-file-key",
          mimeType: "application/zip",
          buffer: Buffer.from("test data"),
          submissionDate: mockSubmissions[0].submissionDate,
          groupId: 123,
          penalty: 0,
          type: [DeliverableType.GIT],
          status: "PASSED",
        },
      ];

      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.findAllByDeliverable(123);

      expect(result).toEqual(expectedResponse);
      expect(result[0].type).toEqual([DeliverableType.GIT]);
    });
  });

  describe("findOne", () => {
    test("should get a specific submission", async () => {
      const mockDeliverable = {
        id: 1,
        type: [DeliverableType.FILE],
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "PASSED",
        penalty: 0,
        fileUrl: "mocked-zip-key",
        submissionDate: new Date(),
      };

      const mockFileResponse = {
        submissionId: mockSubmission.id,
        deliverableId: 1,
        fileKey: mockSubmission.fileUrl,
        mimeType: "application/zip",
        buffer: Buffer.from("test data"),
        submissionDate: mockSubmission.submissionDate,
        groupId: mockSubmission.groupId,
        penalty: Number(mockSubmission.penalty),
        type: mockDeliverable.type,
        status: mockSubmission.status,
      };

      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.findOne(1, 1);

      expect(result).toEqual(mockFileResponse);
      expect(mockPrismaService.deliverables.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.submissions.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
    });

    test("should throw NotFoundException when deliverable doesn't exist", async () => {
      const error = new Error("Record not found");
      mockPrismaService.deliverables.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.findOne(1, 1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should throw NotFoundException when submission doesn't exist", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const error = new Error("Record not found");
      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.findOne(1, 1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should throw BadRequestException when fileUrl is missing", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "PASSED",
        penalty: 0,
        fileUrl: null,
        submissionDate: new Date(),
      };

      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);

      let error: Error | null = null;
      try {
        await controller.findOne(1, 1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toContain("File URL is missing");
    });
  });

  describe("deleteSubmission", () => {
    test("should delete a submission", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "PASSED",
        penalty: 0,
        fileUrl: "mocked-zip-key",
        submissionDate: new Date(),
      };

      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await controller.deleteSubmission(1, 1);

      expect(mockPrismaService.deliverables.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.submissions.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should throw NotFoundException when deliverable doesn't exist", async () => {
      const error = new Error("Record not found");
      mockPrismaService.deliverables.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.deleteSubmission(1, 1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should throw NotFoundException when submission doesn't exist", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const error = new Error("Record not found");
      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockRejectedValue(error);

      let caughtError: Error | null = null;
      try {
        await controller.deleteSubmission(1, 1);
      } catch (e) {
        caughtError = e as Error;
      }

      expect(caughtError).toBe(error);
    });

    test("should handle submission with missing fileUrl", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "PASSED",
        penalty: 0,
        fileUrl: null,
        submissionDate: new Date(),
      };

      mockPrismaService.deliverables.findUniqueOrThrow.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUniqueOrThrow.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});

      await controller.deleteSubmission(1, 1);

      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
