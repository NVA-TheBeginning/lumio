import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { File } from "@nest-lab/fastify-multer";
import { BadRequestException, NotFoundException } from "@nestjs/common";
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
  };

  const mockPrismaService = {
    deliverables: {
      findUnique: mock(),
    },
    submissions: {
      create: mock(),
      findMany: mock(),
      findUnique: mock(),
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
    test("should submit a deliverable successfully", async () => {
      const mockDeliverable = {
        id: 1,
        projectId: 100,
        promotionId: 200,
        type: DeliverableType.FILE,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        allowLateSubmission: true,
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

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.create.mockResolvedValue(mockSubmission);

      await controller.submit(1, 123, mockFile as unknown as File);

      expect(mockPrismaService.deliverables.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.uploadZipSubmission).toHaveBeenCalledWith(
        mockFile.buffer,
        123,
        mockDeliverable.projectId,
        mockDeliverable.promotionId,
        1,
      );
      expect(mockPrismaService.submissions.create).toHaveBeenCalledWith({
        data: {
          deliverableId: 1,
          status: "PASSED",
          groupId: 123,
          penalty: 0,
          fileUrl: "mocked-zip-key",
        },
      });
    });

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

    test("should apply penalty for late submissions", async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 5);

      const mockDeliverable = {
        id: 1,
        projectId: 100,
        promotionId: 200,
        type: DeliverableType.FILE,
        deadline: pastDate,
        allowLateSubmission: true,
      };

      const mockSubmission = {
        id: 1,
        deliverableId: 1,
        groupId: 123,
        status: "LATE",
        penalty: 5,
        fileUrl: "mocked-zip-key",
        submissionDate: new Date(),
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.create.mockResolvedValue(mockSubmission);

      await controller.submit(1, 123, mockFile as unknown as File);

      expect(mockPrismaService.submissions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "LATE",
          penalty: expect.any(Number),
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

  describe("findAllByDeliverable", () => {
    test("should get all submissions for a deliverable", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      const mockSubmissions = [
        {
          id: 1,
          deliverableId: 1,
          groupId: 123,
          status: "PASSED",
          penalty: 0,
          fileUrl: "mocked-zip-key-1",
          submissionDate: new Date(),
        },
        {
          id: 2,
          deliverableId: 1,
          groupId: 124,
          status: "LATE",
          penalty: 5,
          fileUrl: "mocked-zip-key-2",
          submissionDate: new Date(),
        },
      ];

      const mockFileResponses = mockSubmissions.map((submission) => ({
        submissionId: submission.id,
        deliverableId: 1,
        fileKey: submission.fileUrl,
        mimeType: "application/zip",
        buffer: Buffer.from("test data"),
        submissionDate: submission.submissionDate,
        groupId: submission.groupId,
        penalty: Number(submission.penalty),
        type: mockDeliverable.type,
        status: submission.status,
      }));

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findMany.mockResolvedValue(mockSubmissions);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.findAllByDeliverable(1);

      expect(result).toEqual(mockFileResponses);
      expect(mockPrismaService.deliverables.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.submissions.findMany).toHaveBeenCalledWith({
        where: { deliverableId: 1 },
        orderBy: { submissionDate: "desc" },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledTimes(mockSubmissions.length);
    });

    test("should throw NotFoundException when deliverable doesn't exist", async () => {
      mockPrismaService.deliverables.findUnique.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await controller.findAllByDeliverable(1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(NotFoundException);
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

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(mockSubmission);
      mockS3Service.getFile.mockResolvedValue(Buffer.from("test data"));

      const result = await controller.findOne(1, 1);

      expect(result).toEqual(mockFileResponse);
      expect(mockPrismaService.deliverables.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.submissions.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.getFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
    });

    test("should throw NotFoundException when deliverable doesn't exist", async () => {
      mockPrismaService.deliverables.findUnique.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await controller.findOne(1, 1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });

    test("should throw NotFoundException when submission doesn't exist", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await controller.findOne(1, 1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(NotFoundException);
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

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(mockSubmission);

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

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await controller.deleteSubmission(1, 1);

      expect(mockPrismaService.deliverables.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.submissions.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(mockSubmission.fileUrl);
      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should throw NotFoundException when deliverable doesn't exist", async () => {
      mockPrismaService.deliverables.findUnique.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await controller.deleteSubmission(1, 1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });

    test("should throw NotFoundException when submission doesn't exist", async () => {
      const mockDeliverable = {
        id: 1,
        type: DeliverableType.FILE,
      };

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await controller.deleteSubmission(1, 1);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(NotFoundException);
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

      mockPrismaService.deliverables.findUnique.mockResolvedValue(mockDeliverable);
      mockPrismaService.submissions.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submissions.delete.mockResolvedValue({});

      await controller.deleteSubmission(1, 1);

      expect(mockPrismaService.submissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
