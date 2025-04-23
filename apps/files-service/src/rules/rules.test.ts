import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { RuleType } from "@prisma-files/client";
import { AppModule } from "@/app.module.js";
import { createDeliverableDto } from "@/deliverables/deliverables.test";
import { PrismaService } from "@/prisma.service";
import { CreateDeliverableRuleDto } from "./dto/rules.dto";

const createRuleDto = (projectId: number, promoId: number): CreateDeliverableRuleDto => ({
  projectId,
  promotionId: promoId,
  ruleType: RuleType.SIZE_LIMIT,
  ruleDetails: JSON.stringify({ maxSize: 10485760, unit: "MB" }),
});

describe("Deliverable Rules", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const projectId = Math.floor(Math.random() * 1000) + 1;
  const promotionId = Math.floor(Math.random() * 1000) + 1;
  let ruleId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);

    const deliverable = createDeliverableDto(`Test Deliverable ${Date.now()}`, projectId, promotionId);
    await prisma.deliverables.create({
      data: deliverable,
    });
  });

  test("/deliverables/rules (POST) - should fail with invalid projectId", async () => {
    const invalidRuleDto = createRuleDto(-1, promotionId);
    const response = await app.inject({
      method: "POST",
      url: "/deliverables/rules",
      payload: invalidRuleDto,
    });

    expect(response.statusCode).toEqual(404);
  });

  test("/deliverables/rules (POST) - should create a new rule", async () => {
    const ruleDto = createRuleDto(projectId, promotionId);
    const response = await app.inject({
      method: "POST",
      url: "/deliverables/rules",
      payload: ruleDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
    expect(body).toHaveProperty("ruleType", RuleType.SIZE_LIMIT);
    expect(body).toHaveProperty("ruleDetails");

    ruleId = body.id;
  });

  test("/deliverables/rules/:projectId/:promotionId (GET) - should return all rules for a project/promo", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/deliverables/rules/${projectId}/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("/rules/:id (GET) - should return a specific rule", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/rules/${ruleId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", ruleId);
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
    expect(body).toHaveProperty("ruleType", RuleType.SIZE_LIMIT);
  });

  test("/rules/:id (PUT) - should update a rule", async () => {
    const updatedRuleDetails = JSON.stringify({ maxSize: 5242880, unit: "MB" });
    const response = await app.inject({
      method: "PUT",
      url: `/rules/${ruleId}`,
      payload: {
        ruleDetails: updatedRuleDetails,
      },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", ruleId);
    expect(body).toHaveProperty("ruleDetails", updatedRuleDetails);
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
  });

  test("/rules/:id (DELETE) - should delete a rule", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/rules/${ruleId}`,
    });

    expect(response.statusCode).toEqual(204);

    const checkResponse = await app.inject({
      method: "GET",
      url: `/rules/${ruleId}`,
    });
    expect(checkResponse.statusCode).toEqual(404);
  });

  afterAll(async () => {
    try {
      await prisma.deliverables.deleteMany({
        where: {
          projectId: projectId,
          promotionId: promotionId,
        },
      });
      await prisma.deliverablesRules.deleteMany({
        where: {
          projectId: projectId,
          promotionId: promotionId,
        },
      });
    } catch (error) {
      console.error("Error in cleanup:", error);
    }

    await app.close();
  });
});
