import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";
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

  const createPromotionDto: CreatePromotionDto = {
    name: promotionName,
    description: "A test promotion",
    creatorId: 1,
    students_csv: `Doe,John,john.doe@example.com\nSmith,Jane,jane.smith@example.com`,
  };

  test("/promotions (POST) - should create a new promotion", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/promotions",
      payload: createPromotionDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("name", createPromotionDto.name);
    expect(body).toHaveProperty("studentsData", [
      { firstname: "John", name: "Doe", email: "john.doe@example.com" },
      { firstname: "Jane", name: "Smith", email: "jane.smith@example.com" },
    ]);
    promotionId = body.id;
  });

  test("/promotions (GET) - should return a list of promotions", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/promotions",
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toBeInstanceOf(Array);
  });

  test("/promotions/:id (GET) - should return a specific promotion", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/promotions/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", promotionId);
    expect(body).toHaveProperty("name", createPromotionDto.name);
  });

  test("/promotions/:id (PATCH) - should update a specific promotion", async () => {
    const updateData = { description: "Updated description" };
    const response = await app.inject({
      method: "PATCH",
      url: `/promotions/${promotionId}`,
      payload: updateData,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", promotionId);
    expect(body).toHaveProperty("description", updateData.description);
  });

  test("/promotions/:id (DELETE) - should delete a specific promotion", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/promotions/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);

    const getResponse = await app.inject({
      method: "GET",
      url: `/promotions/${promotionId}`,
    });
    expect(getResponse.statusCode).toEqual(404);
  });

  afterAll(async () => {
    await prisma.studentPromotion.deleteMany({
      where: {
        promotionId,
      },
    });
    await app.close();
  });
});
