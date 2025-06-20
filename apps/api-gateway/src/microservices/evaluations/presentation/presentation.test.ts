import { beforeEach, describe, expect, it, jest } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePresentationDto } from "../dto/create-presentation.dto.js";
import { UpdatePresentationDto } from "../dto/update-presentation.dto.js";
import { PresentationController } from "./presentation.controller.js";

describe("PresentationController", () => {
  let controller: PresentationController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentationController],
      providers: [{ provide: MicroserviceProxyService, useValue: { forwardRequest: jest.fn() } }],
    }).compile();

    controller = module.get(PresentationController);
    proxy = module.get(MicroserviceProxyService);
  });

  it("create calls proxy.forwardRequest", async () => {
    const dto: CreatePresentationDto = {
      projectPromotionId: 1,
      startDatetime: new Date().toISOString(),
      durationPerGroup: 30,
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 10, ...dto });

    const result = await controller.create(1, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/presentations", "POST", dto);
    expect(result).toEqual({ id: 10, ...dto });
  });

  it("findAll calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve([]));
    const result = await controller.findAll(2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/2/presentations", "GET");
    expect(result).toEqual([]);
  });

  it("update calls proxy.forwardRequest", async () => {
    const dto: UpdatePresentationDto = { durationPerGroup: 45 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5, ...dto });

    const result = await controller.update(1, 5, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/presentations/5", "PUT", dto);
    expect(result).toEqual({ id: 5, ...dto });
  });

  it("remove calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });
    const result = await controller.remove(1, 7);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/projects/1/presentations/7", "DELETE");
    expect(result).toEqual({ deleted: true });
  });
});
