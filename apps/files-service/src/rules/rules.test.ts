import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { RuleType } from "@prisma-files/client";
import { AppModule } from "@/app.module.js";
import { createDeliverableDto } from "@/deliverables/deliverables.test";
import { PrismaService } from "@/prisma.service";
import { CreateDeliverableRuleDto } from "./dto/rules.dto";

const createRuleDto = (deliverableId: number): CreateDeliverableRuleDto => ({
  deliverableId,
  ruleType: RuleType.SIZE_LIMIT,
  ruleDetails: { maxSizeInBytes: 10485760 },
});

interface RuleResponse {
  id: number;
  deliverableId: number;
  ruleType: RuleType;
  ruleDetails: string;
}

describe("Deliverable Rules", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const projectId = Math.floor(Math.random() * 1000) + 1;
  const promotionId = Math.floor(Math.random() * 1000) + 1;
  let ruleId: number;
  let deliverableId: number;
  const createdRuleIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);

    const deliverable = createDeliverableDto(`Test Deliverable ${Date.now()}`, projectId, promotionId);
    const createdDeliverable = await prisma.deliverables.create({
      data: deliverable,
    });
    deliverableId = createdDeliverable.id;
  });

  test("/deliverables/rules (POST) - should fail with invalid deliverableId", async () => {
    const invalidRuleDto = createRuleDto(-1);
    const response = await app.inject({
      method: "POST",
      url: "/deliverables/rules",
      payload: invalidRuleDto,
    });

    expect(response.statusCode).toEqual(404);
  });

  test("/deliverables/rules (POST) - should create a new rule", async () => {
    const ruleDto = createRuleDto(deliverableId);
    const response = await app.inject({
      method: "POST",
      url: "/deliverables/rules",
      payload: ruleDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body) as RuleResponse;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("deliverableId", deliverableId);
    expect(body).toHaveProperty("ruleType", RuleType.SIZE_LIMIT);
    expect(body).toHaveProperty("ruleDetails");
    expect(typeof body.id).toBe("number");

    ruleId = body.id;
    createdRuleIds.push(body.id);
  });

  test("/deliverables/:deliverableId/rules (GET) - should return all rules for a deliverable", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/deliverables/${deliverableId}/rules`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as RuleResponse[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const rule = body.find((r) => r.id === ruleId);
    expect(rule).toBeDefined();
    expect(rule?.deliverableId).toBe(deliverableId);
    expect(rule?.ruleType).toBe(RuleType.SIZE_LIMIT);
  });

  test("/rules/:id (GET) - should return a specific rule", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/rules/${ruleId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as RuleResponse;
    expect(body).toHaveProperty("id", ruleId);
    expect(body).toHaveProperty("deliverableId", deliverableId);
    expect(body).toHaveProperty("ruleType", RuleType.SIZE_LIMIT);
    expect(body).toHaveProperty("ruleDetails");
  });

  test("/rules/:id (PUT) - should update a rule", async () => {
    const updatedRuleDetails = { maxSizeInBytes: 5242880 };
    const response = await app.inject({
      method: "PUT",
      url: `/rules/${ruleId}`,
      payload: {
        ruleDetails: updatedRuleDetails,
      },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as RuleResponse;
    expect(body).toHaveProperty("id", ruleId);
    expect(body).toHaveProperty("ruleDetails", JSON.stringify(updatedRuleDetails));
    expect(body).toHaveProperty("deliverableId", deliverableId);
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

    const index = createdRuleIds.indexOf(ruleId);
    if (index > -1) {
      createdRuleIds.splice(index, 1);
    }
  });

  afterAll(async () => {
    try {
      if (createdRuleIds.length > 0) {
        await prisma.deliverablesRules.deleteMany({
          where: {
            id: {
              in: createdRuleIds,
            },
          },
        });
      }

      await prisma.deliverablesRules.deleteMany({
        where: {
          deliverableId: deliverableId,
        },
      });

      await prisma.deliverables.deleteMany({
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
