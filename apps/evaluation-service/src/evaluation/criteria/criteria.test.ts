import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { CriterionType } from "@prisma-evaluation/client";
import { AppModule } from "@/app.module.js";
import { CreateCriteriaDto } from "@/evaluation/criteria/dto/create-criteria.dto";
import { UpdateCriteriaDto } from "@/evaluation/criteria/dto/update-criteria.dto";
import { PrismaService } from "@/prisma.service";

describe("Critères de notation", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectPromotionId: number;
  let criteriaId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // Seed: utiliser projectPromotion existant ou en créer un
    projectPromotionId = 1;
  });

  test("POST /projects/:id/criteria - crée un critère", async () => {
    const dto: CreateCriteriaDto = {
      name: "Clarté",
      weight: 20,
      type: CriterionType.PRESENTATION,
      individual: false,
    };
    const res = await app.inject({
      method: "POST",
      url: `/projects/${projectPromotionId}/criteria`,
      payload: dto,
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(dto.name);
    criteriaId = body.id;
  });

  test("GET /projects/:id/criteria - liste les critères", async () => {
    const res = await app.inject({ method: "GET", url: `/projects/${projectPromotionId}/criteria` });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((c: { id: number }) => c.id === criteriaId)).toBe(true);
  });

  test("PUT /criteria/:id - met à jour un critère", async () => {
    const dto: UpdateCriteriaDto = { weight: 25 };
    const res = await app.inject({ method: "PUT", url: `/criteria/${criteriaId}`, payload: dto });
    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.weight).toBe(25);
  });

  test("DELETE /criteria/:id - supprime un critère", async () => {
    const res = await app.inject({ method: "DELETE", url: `/criteria/${criteriaId}` });
    expect(res.statusCode).toBe(200);
    const getRes = await app.inject({ method: "GET", url: `/criteria/${criteriaId}` });
    expect(getRes.statusCode).toBe(404);
  });

  afterAll(async () => {
    if (criteriaId) await prisma.gradingCriteria.deleteMany({ where: { id: criteriaId } });
    await app.close();
  });
});
