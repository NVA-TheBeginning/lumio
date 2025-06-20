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
    const result = await controller.findAll(1);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/final-grades", "GET");
    expect(result).toEqual([]);
  });

  it("updateAll calls proxy.forwardRequest", async () => {
    const dtos: UpdateFinalGradeDto[] = [{ userId: 1, finalGrade: 12 }];
    (proxy.forwardRequest as jest.Mock).mockResolvedValue(dtos);
    const result = await controller.updateAll(1, dtos);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/final-grades", "PUT", dtos);
    expect(result).toEqual(dtos);
  });
});
