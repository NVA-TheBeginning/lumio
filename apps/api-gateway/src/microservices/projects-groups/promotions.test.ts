/** biome-ignore-all lint/suspicious/noExplicitAny: Needed for mocking */
import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { PromotionsController } from "./promotions.controller.js";
import { PromotionsService } from "./promotions.service.js";

describe("PromotionsController", () => {
  let promotionsController: PromotionsController;
  let microserviceProxyService: MicroserviceProxyService;
  let promotionsService: PromotionsService;

  const mockPromotion = {
    id: 1,
    name: "Test Promotion",
    description: "This is a test promotion",
    creatorId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
    studentPromotions: [],
  };

  const mockStudent = {
    id: 1,
    email: "test@example.com",
    firstname: "Test",
    lastname: "User",
    role: "student",
  };

  beforeEach(() => {
    microserviceProxyService = {
      forwardRequest: mock(async () => mockPromotion),
    } as unknown as MicroserviceProxyService;

    promotionsService = {
      create: mock(async () => mockPromotion),
    } as unknown as PromotionsService;

    promotionsController = new PromotionsController(microserviceProxyService, promotionsService);
  });

  it("should be defined", () => {
    expect(promotionsController).toBeDefined();
  });

  describe("getPromotionStudents", () => {
    it("should return an empty array if no studentIds are found", async () => {
      (microserviceProxyService.forwardRequest as Mock<any>).mockResolvedValueOnce({
        id: 1,
        name: "Test Promotion",
        description: "This is a test promotion",
        creatorId: 123,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentPromotions: [],
      });

      const result = await promotionsController.getPromotionStudents(1);
      expect(result).toEqual([]);
    });

    it("should fetch students and return them", async () => {
      (microserviceProxyService.forwardRequest as Mock<any>)
        .mockResolvedValueOnce({
          id: 1,
          name: "Test Promotion",
          description: "This is a test promotion",
          creatorId: 123,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentPromotions: [{ userId: 1 }],
        })
        .mockResolvedValueOnce([mockStudent]);

      const result = await promotionsController.getPromotionStudents(1);
      expect(microserviceProxyService.forwardRequest).toHaveBeenCalledWith("auth", "/users?ids=1", "GET", undefined, {
        page: undefined,
        size: undefined,
      });
      expect(result).toEqual([mockStudent]);
    });
  });

  describe("findAllWithStudents", () => {
    it("should return promotions with associated students", async () => {
      (microserviceProxyService.forwardRequest as Mock<any>)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: "Test Promotion",
            description: "Test Description",
            creatorId: 123,
            createdAt: new Date(),
            updatedAt: new Date(),
            studentPromotions: [{ userId: 1 }],
          },
        ])
        .mockResolvedValueOnce([mockStudent]);

      const result = await promotionsController.findAllWithStudents();

      expect(microserviceProxyService.forwardRequest).toHaveBeenNthCalledWith(1, "project", "/promotions", "GET");
      expect(microserviceProxyService.forwardRequest).toHaveBeenNthCalledWith(2, "auth", "/users?ids=1", "GET");
      expect(result).toEqual([
        {
          id: 1,
          name: "Test Promotion",
          description: "Test Description",
          creatorId: 123,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          students: [mockStudent],
        },
      ]);
    });

    it("should return promotions with empty students array when no students are associated", async () => {
      (microserviceProxyService.forwardRequest as Mock<any>).mockResolvedValueOnce([
        {
          id: 1,
          name: "Test Promotion",
          description: "Test Description",
          creatorId: 123,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentPromotions: [],
        },
      ]);

      const result = await promotionsController.findAllWithStudents();

      expect(microserviceProxyService.forwardRequest).toHaveBeenCalledWith("project", "/promotions", "GET");
      expect(result).toEqual([
        {
          id: 1,
          name: "Test Promotion",
          description: "Test Description",
          creatorId: 123,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          students: [],
        },
      ]);
    });
  });
});
