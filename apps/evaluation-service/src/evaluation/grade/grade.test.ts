import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { CreateGradeDto } from "@/evaluation/grade/dto/create-grade.dto";
import { UpdateGradeDto } from "@/evaluation/grade/dto/update-grade.dto";
import { PrismaService } from "@/prisma.service";

describe("Notes", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let criteriaId: number;
  let gradeId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    // Seed: créer un critère pour les tests
    const crit = await prisma.gradingCriteria.create({
      data: {
        projectPromotionId: 1,
        name: "Test",
        weight: 10,
        type: "DELIVERABLE",
        individual: false,
      },
    });
    criteriaId = crit.id;
  });

  test("POST /criteria/:id/grades - crée une note", async () => {
    const dto: CreateGradeDto = { groupId: 1, gradeValue: 15, comment: "Bon travail" };
    const res = await app.inject({ method: "POST", url: `/criteria/${criteriaId}/grades`, payload: dto });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("id");
    gradeId = body.id;
  });

  test("GET /criteria/:id/grades - liste les notes", async () => {
    const res = await app.inject({ method: "GET", url: `/criteria/${criteriaId}/grades` });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((g: { id: number }) => g.id === gradeId)).toBe(true);
  });

  test("PUT /grades/:id - met à jour une note", async () => {
    const dto: UpdateGradeDto = { gradeValue: 18 };
    const res = await app.inject({ method: "PUT", url: `/grades/${gradeId}`, payload: dto });
    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.gradeValue).toBe(18);
  });

  test("DELETE /grades/:id - supprime une note", async () => {
    const res = await app.inject({ method: "DELETE", url: `/grades/${gradeId}` });
    expect(res.statusCode).toBe(200);
    const getRes = await app.inject({ method: "GET", url: `/grades/${gradeId}` });
    expect(getRes.statusCode).toBe(404);
  });

  afterAll(async () => {
    if (gradeId) await prisma.grade.deleteMany({ where: { id: gradeId } });
    if (criteriaId) await prisma.gradingCriteria.deleteMany({ where: { id: criteriaId } });
    await app.close();
  });
});
