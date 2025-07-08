import { beforeEach, describe, expect, jest, test } from "bun:test";
import { addMinutes } from "date-fns";
import { ReorderDto } from "@/evaluation/order/dto/reorder-orders.dto";
import { SaveOrdersDto } from "@/evaluation/order/dto/save-orders.dto";
import { UpdateOrderDto } from "@/evaluation/order/dto/update-order.dto";
import { OrderService } from "./order.service.js";

type PrismaMock = ReturnType<typeof createPrismaMock>;
function createPrismaMock() {
  return {
    presentation: {
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(),
    },
    presentationOrder: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // biome-ignore lint/suspicious/noExplicitAny: any is used here to mock PrismaService
    $transaction: jest.fn(async (fn: any) => fn(prisma)),
  };
}

let prisma: PrismaMock;
let service: OrderService;

beforeEach(() => {
  prisma = createPrismaMock();
  // biome-ignore lint/suspicious/noExplicitAny: any is used here to mock PrismaService
  service = new OrderService(prisma as any);
});

describe("saveOrderList()", () => {
  test("creates slots with computed schedule", async () => {
    const start = new Date("2025-09-05T08:30:00Z");
    prisma.presentation.findUniqueOrThrow.mockResolvedValue({
      startDatetime: start,
      durationPerGroup: 20,
    });

    const dto: SaveOrdersDto = { groupIds: [5, 6, 7] };
    const result = await service.saveOrderList(1, dto);
    expect(result).toEqual({ created: 3 });

    const { data } = prisma.presentationOrder.createMany.mock.calls[0][0];
    expect(data).toHaveLength(3);
    expect(data[0]).toMatchObject({ groupId: 5, orderNumber: 1, scheduledDatetime: start });
    expect(data[2].scheduledDatetime.getTime()).toBe(addMinutes(start, 40).getTime());
  });
});

describe("update()", () => {
  test("moves slot when orderNumber changes", async () => {
    prisma.presentationOrder.findMany.mockResolvedValue([
      { id: 1, orderNumber: 1 },
      { id: 2, orderNumber: 2 },
      { id: 3, orderNumber: 3 },
    ]);
    prisma.presentation.findUniqueOrThrow.mockResolvedValue({
      startDatetime: new Date("2025-01-01T10:00:00Z"),
      durationPerGroup: 15,
    });

    prisma.presentationOrder.findUnique.mockResolvedValue({
      id: 2,
      presentationId: 99,
      orderNumber: 2,
    });

    const dto: UpdateOrderDto = { orderNumber: 1 };
    await service.update(2, dto);

    const calls = prisma.presentationOrder.update.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0].data.orderNumber).toBe(1); // id 2 moved first
    expect(calls[2][0].data.orderNumber).toBe(3); // ex-1 devient 3
  });

  test("updates only groupId when orderNumber not provided", async () => {
    prisma.presentationOrder.findUnique.mockResolvedValue({
      id: 10,
      presentationId: 1,
      orderNumber: 1,
    });
    const dto: UpdateOrderDto = { groupId: 999 };
    await service.update(10, dto);

    expect(prisma.presentationOrder.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { groupId: 999 },
    });
  });
});

describe("reorder()", () => {
  test("resequence list according to {from,to}", async () => {
    prisma.presentationOrder.findMany.mockResolvedValue([
      { id: 1, orderNumber: 1 },
      { id: 2, orderNumber: 2 },
      { id: 3, orderNumber: 3 },
    ]);
    prisma.presentation.findUniqueOrThrow.mockResolvedValue({
      startDatetime: new Date(),
      durationPerGroup: 10,
    });

    const dto: ReorderDto = { from: 3, to: 1 };
    await service.reorder(77, dto);

    const firstUpdate = prisma.presentationOrder.update.mock.calls[0][0];
    expect(firstUpdate.where.id).toBe(3); // id 3 now first
    expect(firstUpdate.data.orderNumber).toBe(1);
  });
});

describe("remove()", () => {
  test("deletes slot then resequences", async () => {
    prisma.presentationOrder.findUnique.mockResolvedValue({
      id: 9,
      presentationId: 123,
      orderNumber: 2,
    });
    prisma.presentation.findUniqueOrThrow.mockResolvedValue({
      startDatetime: new Date(),
      durationPerGroup: 5,
    });
    prisma.presentationOrder.findMany.mockResolvedValue([{ id: 10, orderNumber: 1 }]);

    const res = await service.remove(9);

    expect(res).toEqual({ deleted: true });
    expect(prisma.presentationOrder.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(prisma.presentationOrder.update).toHaveBeenCalled(); // ✅ désormais true
  });
});
