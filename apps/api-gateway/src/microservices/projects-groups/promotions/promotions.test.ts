import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { PromotionsController } from "./promotions.controller.js";
import { PromotionsService } from "./promotions.service.js";

interface PromotionEntity {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  studentPromotions: Array<{ userId: number }>;
}

interface Student {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

describe("PromotionsController", () => {
  let promotionsController: PromotionsController;
  let microserviceProxyService: MicroserviceProxyService;
  let promotionsService: PromotionsService;

  const mockPromotion: PromotionEntity = {
    id: 1,
    name: "Test Promotion",
    description: "This is a test promotion",
    creatorId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
    studentPromotions: [],
  };

  const mockStudent: Student = {
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
      // @ts-ignore
      (microserviceProxyService.forwardRequest as Mock<PromotionEntity>).mockResolvedValueOnce({
        ...mockPromotion,
        studentPromotions: [],
      });

      const result = await promotionsController.getPromotionStudents(1);
      expect(result).toEqual([]);
    });

    it("should fetch students and return them", async () => {
      // @ts-ignore
      (microserviceProxyService.forwardRequest as Mock<PromotionEntity>)
        .mockResolvedValueOnce({
          ...mockPromotion,
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
      // @ts-ignore
      (microserviceProxyService.forwardRequest as Mock<PromotionEntity[]>)
        .mockResolvedValueOnce([{ ...mockPromotion, studentPromotions: [{ userId: 1 }] }])
        .mockResolvedValueOnce([mockStudent]);

      const result = await promotionsController.findAllWithStudents();

      expect(microserviceProxyService.forwardRequest).toHaveBeenNthCalledWith(1, "project", "/promotions", "GET");
      expect(microserviceProxyService.forwardRequest).toHaveBeenNthCalledWith(2, "auth", "/users?ids=1", "GET");
      expect(result).toEqual([
        {
          id: 1,
          name: "Test Promotion",
          description: "This is a test promotion",
          creatorId: 123,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          students: [mockStudent],
        },
      ]);
    });

    it("should return promotions with empty students array when no students are associated", async () => {
      // @ts-ignore
      (microserviceProxyService.forwardRequest as Mock<PromotionEntity[]>).mockResolvedValueOnce([
        { ...mockPromotion, studentPromotions: [] },
      ]);

      const result = await promotionsController.findAllWithStudents();

      expect(microserviceProxyService.forwardRequest).toHaveBeenCalledWith("project", "/promotions", "GET");
      expect(result).toEqual([
        {
          id: 1,
          name: "Test Promotion",
          description: "This is a test promotion",
          creatorId: 123,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          students: [],
        },
      ]);
    });
  });

  describe("findByStudent (gateway)", () => {
    interface Promotion {
      id: number;
      name: string;
      description: string;
      creatorId: number;
      createdAt: Date;
      updatedAt: Date;
      studentPromotions: Array<{ userId: number }>;
    }

    let controller: PromotionsController;
    let proxy: MicroserviceProxyService;

    beforeEach(() => {
      proxy = { forwardRequest: mock(async () => [] as Promotion[]) } as unknown as MicroserviceProxyService;
      controller = new PromotionsController(proxy, promotionsService);
    });

    it("findByStudent should return promotions for existing student", async () => {
      const mockPromos: Promotion[] = [
        {
          id: 1,
          name: "Promo A",
          description: "Desc A",
          creatorId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentPromotions: [],
        },
        {
          id: 2,
          name: "Promo B",
          description: "Desc B",
          creatorId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentPromotions: [],
        },
      ];
      // @ts-ignore
      (proxy.forwardRequest as Mock<PromotionEntity[]>).mockResolvedValueOnce(mockPromos);

      const result = await controller.findByStudent(42);

      expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/promotions/student/42", "GET");
      expect(result).toEqual(mockPromos);
    });

    it("findByStudent should return empty array for student with no promotions", async () => {
      // @ts-ignore
      (proxy.forwardRequest as Mock<PromotionEntity[]>).mockResolvedValueOnce([]);

      const result = await controller.findByStudent(999);

      expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/promotions/student/999", "GET");
      expect(result).toEqual([]);
    });
  });
});
