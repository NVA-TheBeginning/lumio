import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import type { FastifyRequest } from "fastify";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";

class JwtAuthGuardStub implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const roleHeader = req.headers["x-mock-user-role"] as string | undefined;
    const role = roleHeader === "TEACHER" ? "TEACHER" : "STUDENT";
    // @ts-ignore
    req.user = { sub: 1, email: "test@example.com", role };
    return true;
  }
}

describe("Projects Controller – Detailed View", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectId: number;
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
      prisma.promotion.create({ data: { name: "PromoA", description: "desc", creatorId: 1 } }),
      prisma.promotion.create({ data: { name: "PromoB", description: "desc", creatorId: 1 } }),
    ]);
    promos.forEach((p) => promotionIds.push(p.id));

    const dto = {
      name: "DetailTestProject",
      description: "For detailed route",
      creatorId: 1,
      promotionIds,
      groupSettings: promotionIds.map((pid) => ({
        promotionId: pid,
        minMembers: 1,
        maxMembers: 5,
        mode: "FREE" as const,
        deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })),
    };
    const res = await app.inject({ method: "POST", url: "/projects", payload: dto });
    expect(res.statusCode).toBe(201);
    projectId = JSON.parse(res.body).id;
  });

  test("GET /projects/:id/detailed as TEACHER returns promotions + all groups", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/detailed`,
      headers: { "x-mock-user-role": "TEACHER" },
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(Array.isArray(body.promotions)).toBe(true);
    expect(body.promotions.length).toBe(promotionIds.length);
    expect(body.promotions[0]).toHaveProperty("id", promotionIds[0]);
    expect(body.promotions[0]).toHaveProperty("name");

    expect(Array.isArray(body.groups)).toBe(true);
    expect(body.groups.length).toBe(promotionIds.length);
    expect(body.groups[0].members).toEqual([]);
  });

  test("GET /projects/:id/detailed as STUDENT returns only that student's group", async () => {
    const allGroups = await prisma.group.findMany({ where: { projectId } });
    await prisma.groupMember.create({
      data: { groupId: allGroups[0].id, studentId: 1 },
    });

    const res = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/detailed`,
      headers: { "x-mock-user-role": "STUDENT" },
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(Array.isArray(body.groups)).toBe(true);
    expect(body.groups.length).toBe(1);
    expect(body.groups[0]).toHaveProperty("id", allGroups[0].id);
    expect(body).not.toHaveProperty("promotions");
  });

  afterAll(async () => {
    await prisma.groupMember.deleteMany({ where: { studentId: 1 } });
    await prisma.group.deleteMany({ where: { projectId } });
    await prisma.groupSettings.deleteMany({ where: { projectId } });
    await prisma.projectPromotion.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.promotion.deleteMany({ where: { id: { in: promotionIds } } });
    await app.close();
  });
});
