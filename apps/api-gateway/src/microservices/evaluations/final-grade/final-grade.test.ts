import { beforeEach, describe, expect, it, jest } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { UpdateFinalGradeDto } from "../dto/update-final-grade.dto.js";
import { FinalGradeController } from "./final-grade.controller.js";

describe("FinalGradeController", () => {
  let controller: FinalGradeController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinalGradeController],
      providers: [{ provide: MicroserviceProxyService, useValue: { forwardRequest: jest.fn() } }],
    }).compile();

    controller = module.get(FinalGradeController);
    proxy = module.get(MicroserviceProxyService);
  });

  it("findAll calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve([]));
    const result = await controller.findAll(1, 2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/promotions/2/final-grades", "GET");
    expect(result).toEqual([]);
  });

  it("calculateAndSave calls proxy.forwardRequest", async () => {
    const mockResult = [{ id: 1, finalGrade: 15.5 }];
    (proxy.forwardRequest as jest.Mock).mockResolvedValue(mockResult);
    const result = await controller.calculateAndSave(1, 2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith(
      "evaluation",
      "/projects/1/promotions/2/final-grades",
      "POST",
      {},
    );
    expect(result).toEqual(mockResult);
  });

  it("update calls proxy.forwardRequest", async () => {
    const dto: UpdateFinalGradeDto = { finalGrade: 18.0, comment: "Excellent work" };
    const mockResult = { id: 1, ...dto };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue(mockResult);
    const result = await controller.update(1, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/final-grades/1", "PUT", dto);
    expect(result).toEqual(mockResult);
  });

  it("findOne calls proxy.forwardRequest", async () => {
    const mockResult = { id: 1, finalGrade: 16.5 };
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve(mockResult));
    const result = await controller.findOne(1);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/final-grades/1", "GET");
    expect(result).toEqual(mockResult);
  });
});
