import { beforeEach, describe, expect, it, jest } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateOrderDto } from "../dto/create-order.dto.js";
import { UpdateOrderDto } from "../dto/update-order.dto.js";
import { OrderController } from "./order.controller.js";

describe("OrderController", () => {
  let controller: OrderController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: MicroserviceProxyService, useValue: { forwardRequest: jest.fn() } }],
    }).compile();

    controller = module.get(OrderController);
    proxy = module.get(MicroserviceProxyService);
  });

  it("create calls proxy.forwardRequest", async () => {
    const dto: CreateOrderDto = {
      presentationId: 1,
      groupId: 2,
      orderNumber: 3,
      scheduledDatetime: new Date().toISOString(),
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5, ...dto });
    const result = await controller.create(1, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/presentations/1/orders", "POST", dto);
    expect(result).toEqual({ id: 5, ...dto });
  });

  it("findAll calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockReturnValue(Promise.resolve([]));
    const result = await controller.findAll(2);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/presentations/2/orders", "GET");
    expect(result).toEqual([]);
  });

  it("update calls proxy.forwardRequest", async () => {
    const dto: UpdateOrderDto = { orderNumber: 4 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 7, ...dto });
    const result = await controller.update(7, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/orders/7", "PUT", dto);
    expect(result).toEqual({ id: 7, ...dto });
  });

  it("remove calls proxy.forwardRequest", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });
    const result = await controller.remove(8);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/orders/8", "DELETE");
    expect(result).toEqual({ deleted: true });
  });
});
