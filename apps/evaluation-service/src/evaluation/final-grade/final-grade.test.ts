import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { UpdateFinalGradeDto } from "@/evaluation/final-grade/dto/update-final-grade.dto";
import { PrismaService } from "@/prisma.service";

describe("Notes finales", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const projectPromotionId = 1; // adapter si besoin
  const userId1 = 1;
  const userId2 = 2;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  });

  test("GET /projects/:id/final-grades - liste vide initiale", async () => {
    const res = await app.inject({ method: "GET", url: `/projects/${projectPromotionId}/final-grades` });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  test("PUT /projects/:id/final-grades - crée et met à jour", async () => {
    const dtos: UpdateFinalGradeDto[] = [
      { userId: userId1, finalGrade: 12.5, comment: "OK" },
      { userId: userId2, finalGrade: 14.0 },
    ];
    const res = await app.inject({
      method: "PUT",
      url: `/projects/${projectPromotionId}/final-grades`,
      payload: dtos,
    });
    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated).toHaveLength(2);
    expect(
      updated.some((fg: { userId: number; finalGrade: number }) => fg.userId === userId1 && fg.finalGrade === 12.5),
    ).toBe(true);
    expect(
      updated.some((fg: { userId: number; finalGrade: number }) => fg.userId === userId2 && fg.finalGrade === 14.0),
    ).toBe(true);
  });

  test("GET /projects/:id/final-grades - liste après upsert", async () => {
    const res = await app.inject({ method: "GET", url: `/projects/${projectPromotionId}/final-grades` });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(
      list.some((fg: { userId: number; finalGrade: number }) => fg.userId === userId1 && fg.finalGrade === 12.5),
    ).toBe(true);
    expect(
      list.some((fg: { userId: number; finalGrade: number }) => fg.userId === userId2 && fg.finalGrade === 14.0),
    ).toBe(true);
  });

  afterAll(async () => {
    await prisma.finalGrade.deleteMany({ where: { projectPromotionId } });
    await app.close();
  });
});
