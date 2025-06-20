import { beforeEach, describe, expect, it, jest } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateCriteriaDto } from "../dto/create-criteria.dto.js";
import { UpdateCriteriaDto } from "../dto/update-criteria.dto.js";
import { CriteriaController } from "./criteria.controller.js";

describe("CriteriaController", () => {
  let controller: CriteriaController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteriaController],
      providers: [{ provide: MicroserviceProxyService, useValue: { forwardRequest: jest.fn() } }],
    }).compile();

    controller = module.get(CriteriaController);
    proxy = module.get(MicroserviceProxyService);
  });

  it("create calls proxy.forwardRequest", async () => {
    const dto: CreateCriteriaDto = { name: "Test", weight: 10, type: "REPORT", individual: false };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 3, ...dto });
    const result = await controller.create(1, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/criteria", "POST", dto);
    expect(result).toEqual({ id: 3, ...dto });
  });

  it("findAll calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve([]));
    const result = await controller.findAll(2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/2/criteria", "GET");
    expect(result).toEqual([]);
  });

  it("update calls proxy.forwardRequest", async () => {
    const dto: UpdateCriteriaDto = { weight: 15 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 4, ...dto });
    const result = await controller.update(4, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/criteria/4", "PUT", dto);
    expect(result).toEqual({ id: 4, ...dto });
  });

  it("remove calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });
    const result = await controller.remove(5);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/criteria/5", "DELETE");
    expect(result).toEqual({ deleted: true });
  });
});
