import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { PromotionWithStudentsDto, StudentDto } from "../dto/promotions.dto.js";
import { PromotionsController } from "./promotions.controller.js";
import { PromotionsService } from "./promotions.service.js";

describe("PromotionsController", () => {
  let controller: PromotionsController;
  let proxy: MicroserviceProxyService;
  let service: PromotionsService;

  beforeEach(() => {
    proxy = { forwardRequest: mock(async () => []) } as unknown as MicroserviceProxyService;
    service = {
      create: mock(async () => ({})),
      findAllWithStudents: mock(async () => []),
    } as unknown as PromotionsService;
    controller = new PromotionsController(proxy, service);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPromotionStudents", () => {
    it("returns empty array when no students in promotion", async () => {
      const promo = {
        id: 1,
        name: "",
        description: "",
        creatorId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentPromotions: [],
      };
      (proxy.forwardRequest as Mock<() => Promise<typeof promo>>).mockResolvedValueOnce(promo);

      const result = await controller.getPromotionStudents(1, undefined, undefined);
      expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/promotions/1", "GET");
      expect(result).toEqual([]);
    });

    it("fetches students when promotion has studentPromotions", async () => {
      const student: StudentDto = { id: 1, email: "a@b.c", firstname: "A", lastname: "B", role: "student" };
      const promo = {
        id: 1,
        name: "",
        description: "",
        creatorId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentPromotions: [{ userId: 1 }],
      };
      (proxy.forwardRequest as Mock<() => Promise<unknown>>)
        .mockResolvedValueOnce(promo)
        .mockResolvedValueOnce([student]);

      const result = await controller.getPromotionStudents(1, 2, 5);
      expect(proxy.forwardRequest).toHaveBeenNthCalledWith(1, "project", "/promotions/1", "GET");
      expect(proxy.forwardRequest).toHaveBeenNthCalledWith(2, "auth", "/users?ids=1", "GET", undefined, {
        page: 2,
        size: 5,
      });
      expect(result).toEqual([student]);
    });
  });

  describe("findAllWithStudents", () => {
    it("returns promotions with their students", async () => {
      const dto: PromotionWithStudentsDto = {
        id: 1,
        name: "P",
        description: "D",
        creatorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        students: [{ id: 1, email: "a@b.c", firstname: "A", lastname: "B", role: "student" }],
      };
      (service.findAllWithStudents as Mock<() => Promise<PromotionWithStudentsDto[]>>).mockResolvedValueOnce([dto]);

      const result = await controller.findAllWithStudents();
      expect(service.findAllWithStudents).toHaveBeenCalled();
      expect(result).toEqual([dto]);
    });

    it("returns empty array when no promotions", async () => {
      (service.findAllWithStudents as Mock<() => Promise<PromotionWithStudentsDto[]>>).mockResolvedValueOnce([]);

      const result = await controller.findAllWithStudents();
      expect(result).toEqual([]);
    });
  });

  describe("findByStudent", () => {
    it("calls proxy for findByStudent", async () => {
      const promos: Array<Partial<PromotionWithStudentsDto>> = [{ id: 1 }];
      (proxy.forwardRequest as Mock<() => Promise<typeof promos>>).mockResolvedValueOnce(promos);

      const result = await controller.findByStudent(42);
      expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/promotions/student/42", "GET");
      expect(result).toEqual(promos);
    });

    it("returns empty array when no promotions", async () => {
      (proxy.forwardRequest as Mock<() => Promise<unknown[]>>).mockResolvedValueOnce([]);

      const result = await controller.findByStudent(999);
      expect(result).toEqual([]);
    });
  });
});
