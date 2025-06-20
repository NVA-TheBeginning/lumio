import { beforeEach, describe, expect, it, jest } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateGradeDto } from "../dto/create-grade.dto.js";
import { UpdateGradeDto } from "../dto/update-grade.dto.js";
import { GradeController } from "./grade.controller.js";

describe("GradeController", () => {
  let controller: GradeController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeController],
      providers: [{ provide: MicroserviceProxyService, useValue: { forwardRequest: jest.fn() } }],
    }).compile();

    controller = module.get(GradeController);
    proxy = module.get(MicroserviceProxyService);
  });

  it("create calls proxy.forwardRequest", async () => {
    const dto: CreateGradeDto = { gradingCriteriaId: 1, gradeValue: 16 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 6, ...dto });
    const result = await controller.create(1, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/criteria/1/grades", "POST", dto);
    expect(result).toEqual({ id: 6, ...dto });
  });

  it("findAll calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve([]));
    const result = await controller.findAll(2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/criteria/2/grades", "GET");
    expect(result).toEqual([]);
  });

  it("findOne calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 7 });
    const result = await controller.findOne(7);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/grades/7", "GET");
    expect(result).toEqual({ id: 7 });
  });

  it("update calls proxy.forwardRequest", async () => {
    const dto: UpdateGradeDto = { gradeValue: 18 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 8, ...dto });
    const result = await controller.update(8, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/grades/8", "PUT", dto);
    expect(result).toEqual({ id: 8, ...dto });
  });

  it("remove calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });
    const result = await controller.remove(9);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/grades/9", "DELETE");
    expect(result).toEqual({ deleted: true });
  });
});
