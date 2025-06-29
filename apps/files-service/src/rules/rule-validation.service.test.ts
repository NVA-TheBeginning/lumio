import { beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { BadRequestException } from "@nestjs/common";
import { RuleType } from "@prisma-files/client";
import type { PrismaService } from "@/prisma.service";
import { RuleValidationService } from "./rule-validation.service";

const mockYauzl = {
  fromBuffer: mock(),
};

mock.module("yauzl", () => ({
  fromBuffer: mockYauzl.fromBuffer,
}));

const mockPrismaService = {
  deliverablesRules: {
    findMany: mock(),
  },
} as unknown as PrismaService;

describe("RuleValidationService", () => {
  let service: RuleValidationService;

  beforeEach(() => {
    service = new RuleValidationService(mockPrismaService);
    mockYauzl.fromBuffer.mockClear();
    (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockClear();
  });

  describe("validateSubmission", () => {
    test("should pass when no rules are defined", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("fake zip content");

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result).toEqual({ isValid: true, errors: [] });
      expect(mockPrismaService.deliverablesRules.findMany).toHaveBeenCalledWith({
        where: { deliverableId },
      });
    });

    test("should validate SIZE_LIMIT rule successfully", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("x".repeat(1024));

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.SIZE_LIMIT,
          ruleDetails: JSON.stringify({ maxSizeInBytes: 2048 }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEntry = mockZipfile.on.mock.calls.find((call) => call[0] === "entry")?.[1];
          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];

          if (onEntry) {
            onEntry({ fileName: "test.txt", uncompressedSize: 100 });
          }
          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("should fail SIZE_LIMIT rule when file is too large", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("x".repeat(3072));

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.SIZE_LIMIT,
          ruleDetails: JSON.stringify({ maxSizeInBytes: 2048 }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];

          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("File size exceeds limit");
      expect(result.errors[0]).toContain("0.00MB");
      expect(result.errors[0]).toContain("0.00MB");
    });

    test("should validate FILE_PRESENCE rule - missing required files", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("fake zip content");

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.FILE_PRESENCE,
          ruleDetails: JSON.stringify({
            requiredFiles: ["README.md", "src/main.java"],
            allowedExtensions: [".java", ".md"],
          }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEntry = mockZipfile.on.mock.calls.find((call) => call[0] === "entry")?.[1];
          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];

          if (onEntry) {
            onEntry({ fileName: "README.md", uncompressedSize: 100 });
            onEntry({ fileName: "src/", uncompressedSize: 0 });
            onEntry({ fileName: "src/other.java", uncompressedSize: 200 });
          }
          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required file missing: src/main.java");
    });

    test("should validate DIRECTORY_STRUCTURE rule successfully", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("fake zip content");

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.DIRECTORY_STRUCTURE,
          ruleDetails: JSON.stringify({
            requiredDirectories: ["src", "tests"],
          }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEntry = mockZipfile.on.mock.calls.find((call) => call[0] === "entry")?.[1];
          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];

          if (onEntry) {
            onEntry({ fileName: "src/", uncompressedSize: 0 });
            onEntry({ fileName: "src/main.java", uncompressedSize: 200 });
            onEntry({ fileName: "tests/", uncompressedSize: 0 });
            onEntry({ fileName: "tests/test1.java", uncompressedSize: 150 });
          }
          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("should handle multiple rule violations", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("x".repeat(3072));

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.SIZE_LIMIT,
          ruleDetails: JSON.stringify({ maxSizeInBytes: 2048 }),
        },
        {
          id: 2,
          deliverableId,
          ruleType: RuleType.FILE_PRESENCE,
          ruleDetails: JSON.stringify({
            requiredFiles: ["README.md"],
          }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEntry = mockZipfile.on.mock.calls.find((call) => call[0] === "entry")?.[1];
          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];

          if (onEntry) {
            onEntry({ fileName: "src/", uncompressedSize: 0 });
            onEntry({ fileName: "src/main.java", uncompressedSize: 200 });
          }
          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some((error) => error.includes("File size exceeds limit"))).toBe(true);
      expect(result.errors.some((error) => error.includes("Required file missing: README.md"))).toBe(true);
    });

    test("should handle invalid ZIP file", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("invalid zip content");

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: RuleType.FILE_PRESENCE,
          ruleDetails: JSON.stringify({
            requiredFiles: ["README.md"],
          }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(new Error("Invalid ZIP"), null);
        }, 0);
      });

      await expect(service.validateSubmission(deliverableId, fileBuffer)).rejects.toThrow(BadRequestException);
    });

    test("should handle unsupported rule type", async () => {
      const deliverableId = 1;
      const fileBuffer = Buffer.from("fake zip content");

      const rules = [
        {
          id: 1,
          deliverableId,
          ruleType: "UNSUPPORTED_RULE" as RuleType,
          ruleDetails: JSON.stringify({ someProperty: "value" }),
        },
      ];

      (mockPrismaService.deliverablesRules.findMany as jest.Mock).mockResolvedValue(rules);

      const mockZipfile = {
        on: mock(),
        readEntry: mock(),
      };

      mockYauzl.fromBuffer.mockImplementation((_buffer, _options, callback) => {
        setTimeout(() => {
          callback(null, mockZipfile);

          const onEnd = mockZipfile.on.mock.calls.find((call) => call[0] === "end")?.[1];
          if (onEnd) {
            setTimeout(onEnd, 0);
          }
        }, 0);
      });

      const result = await service.validateSubmission(deliverableId, fileBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unsupported rule type: UNSUPPORTED_RULE");
    });
  });
});
