import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { DeliverableType } from "@prisma-files/client";
import { AppModule } from "@/app.module.js";
import { CreateDeliverableDto } from "@/deliverables/dto/deliverables.dto.js";

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

interface DeliverableResponse {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  promotionId: number;
  deadline: string;
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number;
  type: DeliverableType[];
}

describe("Deliverables", () => {
  let app: NestFastifyApplication;
  let deliverableName = `Test Deliverable ${Date.now()}`;
  const projectId = Math.floor(Math.random() * 1000) + 1;
  const promotionId = Math.floor(Math.random() * 1000) + 1;
  let deliverableId: number;
  const createdDeliverableIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  test("/projects/deliverables (POST) - should create a new deliverable", async () => {
    const deliverableDto = createDeliverableDto(deliverableName, projectId, promotionId);
    const response = await app.inject({
      method: "POST",
      url: "/projects/deliverables",
      payload: deliverableDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body) as DeliverableResponse;
    expect(body).toHaveProperty("name", deliverableDto.name);
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
    expect(body).toHaveProperty("description", deliverableDto.description);
    expect(body).toHaveProperty("allowLateSubmission", deliverableDto.allowLateSubmission);
    expect(body).toHaveProperty("type");
    expect(Array.isArray(body.type)).toBe(true);
    expect(body.type).toContain(DeliverableType.FILE);

    deliverableId = body.id;
    createdDeliverableIds.push(body.id);
  });

  test("/projects/:id/deliverables (GET) - should return all deliverables for a project", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as DeliverableResponse[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const deliverable = body.find((d) => d.id === deliverableId);
    expect(deliverable).toBeDefined();
    expect(deliverable?.name).toBe(deliverableName);
    expect(deliverable?.projectId).toBe(projectId);
    expect(deliverable?.promotionId).toBe(promotionId);
  });

  test("/projects/:id/deliverables (GET) - should filter by promotionId query param", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables?promoId=${promotionId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as DeliverableResponse[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    body.forEach((deliverable) => {
      expect(deliverable.promotionId).toBe(promotionId);
    });
  });

  test("/projects/deliverables (PUT) - should update a deliverable", async () => {
    const updatedName = `Updated Deliverable ${Date.now()}`;
    const response = await app.inject({
      method: "PUT",
      url: "/projects/deliverables",
      payload: {
        id: deliverableId,
        projectId: projectId,
        promotionId: promotionId,
        name: updatedName,
        allowLateSubmission: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body) as DeliverableResponse;
    expect(body).toHaveProperty("id", deliverableId);
    expect(body).toHaveProperty("projectId", projectId);
    expect(body).toHaveProperty("promotionId", promotionId);
    expect(body).toHaveProperty("name", updatedName);
    expect(body).toHaveProperty("allowLateSubmission", false);

    deliverableName = updatedName;
  });

  test("/projects/deliverables/:id (DELETE) - should delete a deliverable", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/projects/deliverables/${deliverableId}`,
    });

    expect(response.statusCode).toEqual(200);

    const checkResponse = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/deliverables`,
    });
    expect(checkResponse.statusCode).toEqual(200);

    const body = JSON.parse(checkResponse.body) as DeliverableResponse[];
    const deletedDeliverable = body.find((d) => d.id === deliverableId);
    expect(deletedDeliverable).toBeUndefined();

    const index = createdDeliverableIds.indexOf(deliverableId);
    if (index > -1) {
      createdDeliverableIds.splice(index, 1);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
