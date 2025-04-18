import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";
import { CreatePromotionDto } from "@/promotions/dto/create-promotion.dto";

describe("Promotions", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const promotionName = `Test Promotion ${Date.now()}`;
  let promotionId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  const createPromotionDto = (): CreatePromotionDto => ({
    name: promotionName,
    description: "Test promotion description",
    creatorId: 1,
    studentIds: [1, 2],
  });

  test("/promotions (POST) - should create a new promotion", async () => {
    const promoDto = createPromotionDto();
    const response = await app.inject({
      method: "POST",
      url: "/promotions",
      payload: promoDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id");

    expect(body).toHaveProperty("name", promoDto.name);
    expect(body).toHaveProperty("description", promoDto.description);

    promotionId = body.id;
  });

  test("/promotions (POST) - should fail when missing required fields", async () => {
    const invalidPromoDto = {
      name: promotionName,
      description: "Test promotion description",
      creatorId: 1,
      // Missing studentIds
    };

    const response = await app.inject({
      method: "POST",
      url: "/promotions",
      payload: invalidPromoDto,
    });

    expect(response.statusCode).toEqual(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("studentIds must be provided and must be an array");
  });

  test("/promotions (GET) - should return all promotions", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/promotions",
    });

    expect(response.statusCode).toEqual(200);

    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("name");
  });

  test("/promotions/:id (GET) - should return the promotion by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/promotions/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", promotionId);
    expect(body).toHaveProperty("name", promotionName);
  });

  test("/promotions/:id (DELETE) - should delete a promotion", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/promotions/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Promotion deleted successfully");
  });

  afterAll(async () => {
    await prisma.studentPromotion.deleteMany({
      where: { promotionId },
    });
    await app.close();
  });
});
