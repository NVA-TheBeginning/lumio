import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { addMinutes } from "date-fns";
import { PrismaService } from "@/prisma.service";
import { OrderModule } from "./order.module";

describe("Evaluation – PresentationOrders", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let presId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [OrderModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);

    /* 📄 seed 1 présentation */
    const start = new Date();
    const pres = await prisma.presentation.create({
      data: {
        projectId: 1,
        promotionId: 1,
        startDatetime: start,
        durationPerGroup: 30,
      },
    });
    presId = pres.id;
  });

  afterAll(async () => {
    await prisma.presentationOrder.deleteMany({ where: { presentationId: presId } });
    await prisma.presentation.delete({ where: { id: presId } });
    await app.close();
  });

  test("POST /presentations/:id/orders/generate (SEQUENTIAL)", async () => {
    const payload = {
      groupIds: [1, 2, 3],
      algorithm: "SEQUENTIAL",
    };

    const res = await app.inject({
      method: "POST",
      url: `/presentations/${presId}/orders/generate`,
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toEqual({ created: 3 });

    /* check DB: orderNumber & scheduledDatetime cohérents */
    const orders = await prisma.presentationOrder.findMany({
      where: { presentationId: presId },
      orderBy: { orderNumber: "asc" },
    });

    expect(orders.map((o) => o.orderNumber)).toEqual([1, 2, 3]);
    const firstDate = orders[0].scheduledDatetime;
    expect(orders[1].scheduledDatetime.getTime()).toBe(addMinutes(firstDate, 30).getTime());
  });

  test("PATCH reorder – permute 3↦1", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/presentations/${presId}/orders/reorder`,
      payload: { from: 3, to: 1 },
    });
    expect(res.statusCode).toBe(200);

    const orders = await prisma.presentationOrder.findMany({
      where: { presentationId: presId },
      orderBy: { orderNumber: "asc" },
    });
    expect(orders[0].groupId).toBe(3);
    expect(orders[2].groupId).toBe(2);
  });

  test("PUT update – change orderNumber explicit", async () => {
    const target = await prisma.presentationOrder.findFirstOrThrow({
      where: { presentationId: presId, orderNumber: 2 },
    });

    const res = await app.inject({
      method: "PUT",
      url: `/orders/${target.id}`,
      payload: { orderNumber: 1 },
    });
    expect(res.statusCode).toBe(200);

    const updated = await prisma.presentationOrder.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(updated.orderNumber).toBe(1);
  });

  test("DELETE /orders/:id – cascade resequence", async () => {
    const all = await prisma.presentationOrder.findMany({ where: { presentationId: presId } });
    const toDelete = all[0];

    const res = await app.inject({
      method: "DELETE",
      url: `/orders/${toDelete.id}`,
    });
    expect(res.statusCode).toBe(200);

    const remaining = await prisma.presentationOrder.findMany({
      where: { presentationId: presId },
      orderBy: { orderNumber: "asc" },
    });

    /* plus que 2 slots, numéro 1 réattribué */
    expect(remaining.length).toBe(2);
    expect(remaining[0].orderNumber).toBe(1);
  });

  test("PATCH reorder – indexes hors limites → 404", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/presentations/${presId}/orders/reorder`,
      payload: { from: 5, to: 1 },
    });
    expect(res.statusCode).toBe(404);
  });
});
