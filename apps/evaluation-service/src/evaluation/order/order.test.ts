import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { CreateOrderDto } from "@/evaluation/order/dto/create-order.dto";
import { UpdateOrderDto } from "@/evaluation/order/dto/update-order.dto";
import { PrismaService } from "@/prisma.service";

describe("Ordres de passage", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let presentationId: number;
  let orderId: number;

  beforeAll(async () => {
    // Initialisation Nest
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // Seed: créer une soutenance pour les tests
    const presentation = await prisma.presentation.create({
      data: {
        projectPromotionId: 1,
        startDatetime: new Date().toISOString(),
        durationPerGroup: 30,
      },
    });
    presentationId = presentation.id;
  });

  test("POST /presentations/:id/orders - crée un ordre", async () => {
    const dto: CreateOrderDto = {
      groupId: 1,
      orderNumber: 1,
      scheduledDatetime: new Date().toISOString(),
    };
    const res = await app.inject({
      method: "POST",
      url: `/presentations/${presentationId}/orders`,
      payload: dto,
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("id");
    expect(body.presentationId).toBe(presentationId);
    orderId = body.id;
  });

  test("GET /presentations/:id/orders - liste les ordres", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/presentations/${presentationId}/orders`,
    });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((o: { id: number }) => o.id === orderId)).toBe(true);
  });

  test("PUT /orders/:id - met à jour un ordre", async () => {
    const dto: UpdateOrderDto = { orderNumber: 2 };
    const res = await app.inject({
      method: "PUT",
      url: `/orders/${orderId}`,
      payload: dto,
    });
    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.orderNumber).toBe(2);
  });

  test("DELETE /orders/:id - supprime un ordre", async () => {
    const res = await app.inject({ method: "DELETE", url: `/orders/${orderId}` });
    expect(res.statusCode).toBe(200);
    const getRes = await app.inject({
      method: "GET",
      url: `/orders/${orderId}`,
    });
    expect(getRes.statusCode).toBe(404);
  });

  afterAll(async () => {
    // Nettoyage
    if (orderId) {
      await prisma.presentationOrder.deleteMany({ where: { id: orderId } });
    }
    if (presentationId) {
      await prisma.presentation.deleteMany({ where: { id: presentationId } });
    }
    await app.close();
  });
});
