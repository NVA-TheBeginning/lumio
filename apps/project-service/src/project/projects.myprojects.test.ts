import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { GroupMode } from "@prisma-project/client";
import type { FastifyRequest } from "fastify";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";

class JwtAuthGuardStub implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const role = (req.headers["x-mock-user-role"] as string)?.toUpperCase() ?? "STUDENT";
    // @ts-ignore
    req.user = { sub: 1, email: "test@example.com", role };
    return true;
  }
}

describe("GET /projects/myprojects (role-based pagination)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectId1: number;
  let projectId2: number;
  const promotionIds: number[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard("jwt"))
      .useClass(JwtAuthGuardStub)
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    const promos = await Promise.all([
      prisma.promotion.create({
        data: { name: "PromoA", description: "desc", creatorId: 1 },
      }),
      prisma.promotion.create({
        data: { name: "PromoB", description: "desc", creatorId: 1 },
      }),
    ]);
    promotionIds.push(promos[0].id, promos[1].id);

    const createDto = {
      name: "MyProj1",
      description: "First",
      creatorId: 1,
      promotionIds,
      groupSettings: promotionIds.map((pid) => ({
        promotionId: pid,
        minMembers: 1,
        maxMembers: 5,
        mode: GroupMode.FREE,
        deadline: new Date(Date.now() + 7 * 864e5).toISOString(),
      })),
    };
    const res1 = await app.inject({ method: "POST", url: "/projects", payload: createDto });
    projectId1 = JSON.parse(res1.body).id;
    const res2 = await app.inject({ method: "POST", url: "/projects", payload: { ...createDto, name: "MyProj2" } });
    projectId2 = JSON.parse(res2.body).id;
  });

  test("as TEACHER: returns paginated projects created by teacher", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/projects/myprojects?page=1&size=1",
      headers: { "x-mock-user-role": "TEACHER" },
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.pagination).toEqual({
      totalRecords: 2,
      currentPage: 1,
      totalPages: 2,
      nextPage: 2,
      prevPage: null,
    });
    expect([projectId1, projectId2]).toContain(body.data[0].id);
  });

  afterAll(async () => {
    await prisma.groupMember.deleteMany({ where: { studentId: 1 } });
    await prisma.group.deleteMany({ where: { projectId: projectId1 } });
    await prisma.group.deleteMany({ where: { projectId: projectId2 } });
    await prisma.groupSettings.deleteMany({ where: { projectId: { in: [projectId1, projectId2] } } });
    await prisma.projectPromotion.deleteMany({ where: { projectId: { in: [projectId1, projectId2] } } });
    await prisma.project.deleteMany({ where: { id: { in: [projectId1, projectId2] } } });
    await prisma.promotion.deleteMany({ where: { id: { in: promotionIds } } });
    await app.close();
  });
});
