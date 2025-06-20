import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";
import { CreatePresentationDto } from "./dto/create-presentation.dto";
import { UpdatePresentationDto } from "./dto/update-presentation.dto";

describe("Presentations (Soutenances)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const projectPromotionId = 1; // Assurez-vous qu'une entrée projectPromotion #1 existe ou adaptez selon votre seed
  let presentationId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  });

  test("POST /projects/:id/presentations - crée une soutenance", async () => {
    const dto: CreatePresentationDto = {
      projectPromotionId,
      startDatetime: new Date().toISOString(),
      endDatetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      durationPerGroup: 30,
    };
    const res = await app.inject({
      method: "POST",
      url: `/projects/${projectPromotionId}/presentations`,
      payload: dto,
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("id");
    expect(body.projectPromotionId).toBe(projectPromotionId);
    presentationId = body.id;
  });

  test("GET /projects/:id/presentations - liste les soutenances", async () => {
    const res = await app.inject({ method: "GET", url: `/projects/${projectPromotionId}/presentations` });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((p: { id: number }) => p.id === presentationId)).toBe(true);
  });

  test("GET /projects/:id/presentations/:id - récupère une soutenance", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/projects/${projectPromotionId}/presentations/${presentationId}`,
    });
    expect(res.statusCode).toBe(200);
    const pres = JSON.parse(res.body);
    expect(pres.id).toBe(presentationId);
  });

  test("PUT /projects/:id/presentations/:id - met à jour une soutenance", async () => {
    const dto: UpdatePresentationDto = { durationPerGroup: 45 };
    const res = await app.inject({
      method: "PUT",
      url: `/projects/${projectPromotionId}/presentations/${presentationId}`,
      payload: dto,
    });
    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.durationPerGroup).toBe(45);
  });

  test("DELETE /projects/:id/presentations/:id - supprime une soutenance", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/projects/${projectPromotionId}/presentations/${presentationId}`,
    });
    expect(res.statusCode).toBe(200);
    const getRes = await app.inject({
      method: "GET",
      url: `/projects/${projectPromotionId}/presentations/${presentationId}`,
    });
    expect(getRes.statusCode).toBe(404);
  });

  afterAll(async () => {
    // Nettoyage éventuel
    if (presentationId) {
      await prisma.presentation.deleteMany({ where: { id: presentationId } });
    }
    await app.close();
  });
});
