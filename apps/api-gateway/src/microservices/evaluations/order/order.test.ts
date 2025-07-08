import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { ReorderDto } from "@/microservices/evaluations/order/dto/reorder-orders.dto.js";
import { SaveOrdersDto } from "@/microservices/evaluations/order/dto/save-orders.dto.js";
import { UpdateOrderDto } from "@/microservices/evaluations/order/dto/update-order.dto.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { OrderController } from "./order.controller.js";

describe("OrderController (Gateway)", () => {
  let controller: OrderController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: MicroserviceProxyService,
          useValue: { forwardRequest: jest.fn() },
        },
      ],
    }).compile();

    controller = mod.get(OrderController);
    proxy = mod.get(MicroserviceProxyService);
    jest.clearAllMocks();
  });

  test("save() forwards payload list → evaluation", async () => {
    const dto: SaveOrdersDto = { groupIds: [11, 12, 13] };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ created: 3 });

    const res = await controller.save(42, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/presentations/42/orders", "POST", dto);
    expect(res).toEqual({ created: 3 });
  });

  test("findAll() forwards GET correctly", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue([]);

    const res = await controller.findAll(99);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/presentations/99/orders", "GET");
    expect(res).toEqual([]);
  });

  test("update() forwards PUT on /orders/:id", async () => {
    const dto: UpdateOrderDto = { groupId: 222 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5 });

    const res = await controller.update(5, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/orders/5", "PUT", dto);
    expect(res).toEqual({ id: 5 });
  });

  test("reorder() forwards PATCH with {from,to}", async () => {
    const dto: ReorderDto = { from: 4, to: 1 };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ reordered: true });

    const res = await controller.reorder(77, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/presentations/77/orders/reorder", "PATCH", dto);
    expect(res).toEqual({ reordered: true });
  });

  test("remove() forwards DELETE /orders/:id", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });

    const res = await controller.remove(55);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("evaluation", "/orders/55", "DELETE");
    expect(res).toEqual({ deleted: true });
  });
});
