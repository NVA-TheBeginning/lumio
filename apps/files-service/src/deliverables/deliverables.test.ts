import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { DeliverableType } from "@prisma-files/client";
import { AppModule } from "@/app.module.js";
import { CreateDeliverableDto } from "@/deliverables/dto/deliverables.dto.js";
import { PrismaService } from "@/prisma.service";

export const createDeliverableDto = (
  deliverableName = `Test Deliverable ${Date.now()}`,
  projectId = 1,
  promotionId = 1,
): CreateDeliverableDto => ({
  promotionId: promotionId,
  name: deliverableName,
  description: "A test deliverable",
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  allowLateSubmission: true,
  lateSubmissionPenalty: 2,
  type: [DeliverableType.FILE],
  projectId: projectId,
});

describe("Deliverables", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let deliverableName = `Test Deliverable ${Date.now()}`;
  const projectId = Math.floor(Math.random() * 1000) + 1;
  const promotionId = Math.floor(Math.random() * 1000) + 1;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  test("/projects/deliverables (POST) - should create a new deliverable", async () => {
    const deliverableDto = createDeliverableDto(deliverableName, projectId, promotionId);
    const response = await app.inject({
      method: "POST",
      url: "/projects/deliverables",
      payload: deliverableDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("name", deliverableDto.name);
  });

  test("/projects/:id/deliverables (GET) - should return all deliverables for a project", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("/projects/:id/deliverables (GET) - should filter by promotionId query param", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables?promoId=${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("/projects/deliverables (PUT) - should update a deliverable", async () => {
    const updatedName = `Updated Deliverable ${Date.now()}`;
    const response = await app.inject({
      method: "PUT",
      url: "/projects/deliverables",
      payload: {
        projectId: projectId,
        promotionId: promotionId,
        name: updatedName,
        allowLateSubmission: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
    expect(body).toHaveProperty("name", updatedName);
    expect(body).toHaveProperty("allowLateSubmission", false);

    deliverableName = updatedName;
  });

  test("/projects/deliverables/:projectId/:promotionId (DELETE) - should delete a deliverable", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/projects/deliverables/${projectId}/${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);

    const checkResponse = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables`,
    });
    expect(checkResponse.statusCode).toEqual(200);
  });

  afterAll(async () => {
    try {
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
