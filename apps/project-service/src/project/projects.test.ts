import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { GroupMode, ProjectStatus } from "@prisma-project/client";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";
import { CreateProjectDto, GroupSettingDto } from "@/project/dto/create-project.dto";

describe("Projects", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const projectName = `Test Project ${Date.now()}`;
  let projectId: number;
  const promotionIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);

    const promotionsData = [
      { name: `Test Promotion 1 ${Date.now()}`, description: "First test promotion", creatorId: 1 },
      { name: `Test Promotion 2 ${Date.now()}`, description: "Second test promotion", creatorId: 1 },
    ];

    const createdPromotions = await Promise.all(
      promotionsData.map((promo) => prisma.promotion.create({ data: promo })),
    );
    createdPromotions.forEach((promo) => promotionIds.push(promo.id));
  });

  const createGroupSettings = (ids: number[]): GroupSettingDto[] =>
    ids.map((id) => ({
      promotionId: id,
      minMembers: 2,
      maxMembers: 5,
      mode: GroupMode.FREE,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

  const createProjectDto = (): CreateProjectDto => ({
    name: projectName,
    description: "A test project",
    creatorId: 1,
    promotionIds,
    groupSettings: createGroupSettings(promotionIds),
  });

  test("/projects (POST) - should create a new project with group settings", async () => {
    const dto = createProjectDto();
    const res = await app.inject({ method: "POST", url: "/projects", payload: dto });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(dto.name);
    expect(body.description).toBe(dto.description);
    projectId = body.id;

    const projectPromotions = await prisma.projectPromotion.findMany({ where: { projectId } });
    expect(projectPromotions).toHaveLength(promotionIds.length);
    expect(projectPromotions[0].status).toBe(ProjectStatus.DRAFT);

    const settings = await prisma.groupSettings.findMany({ where: { projectId } });
    expect(settings).toHaveLength(promotionIds.length);
    settings.forEach((s) => {
      expect(s.minMembers).toBe(2);
      expect(s.maxMembers).toBe(5);
      expect(s.mode).toBe(GroupMode.FREE);
      expect(new Date(s.deadline).getTime()).toBeGreaterThan(Date.now());
    });
  });

  test("/projects (POST) - invalid promotion ids", async () => {
    const invalidDto = { ...createProjectDto(), promotionIds: [999999], groupSettings: createGroupSettings([999999]) };
    const res = await app.inject({ method: "POST", url: "/projects", payload: invalidDto });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("Promotions not found : 999999");
  });

  test("/projects (POST) - invalid groupSettings (min>max)", async () => {
    const invalidDto = {
      ...createProjectDto(),
      groupSettings: promotionIds.map((id) => ({
        promotionId: id,
        minMembers: 10,
        maxMembers: 5,
        mode: GroupMode.FREE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })),
    };
    const res = await app.inject({ method: "POST", url: "/projects", payload: invalidDto });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("minMembers cannot be greater than maxMembers");
  });

  test("/projects (POST) - invalid groupSettings (past deadline)", async () => {
    const invalidDto = {
      ...createProjectDto(),
      groupSettings: promotionIds.map((id) => ({
        promotionId: id,
        minMembers: 2,
        maxMembers: 5,
        mode: GroupMode.FREE,
        deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      })),
    };
    const res = await app.inject({ method: "POST", url: "/projects", payload: invalidDto });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("Deadline must be in the future");
  });

  test("/projects (GET) - should return list including created project", async () => {
    const res = await app.inject({ method: "GET", url: "/projects" });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body) as Array<{ id: number }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((p) => p.id === projectId)).toBe(true);
  });

  test("/projects/myprojects (GET) - should return projects", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/projects/myprojects?userId=1&userRole=STUDENT&page=1&size=10",
    });
    expect(res.statusCode).toBe(200);
  });

  test("/projects/myprojects (GET) - should return projects", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/projects/myprojects?userId=1&userRole=TEACHER&page=1&size=10",
    });
    expect(res.statusCode).toBe(200);
  });

  test("/projects/:id/student (GET) - should not return the project", async () => {
    // Student is not part of the project
    const res = await app.inject({ method: "GET", url: `/projects/${projectId}/student?userId=1` });
    expect(res.statusCode).toBe(404);
  });

  test("/projects/:id/teacher (GET) - should return the project", async () => {
    const res = await app.inject({ method: "GET", url: `/projects/${projectId}/teacher?userId=1` });
    expect(res.statusCode).toBe(200);
    const proj = JSON.parse(res.body);
    expect(proj.id).toBe(projectId);
    expect(proj.name).toBe(projectName);
  });

  test("/projects/:id (PATCH) - should update the project", async () => {
    const updated = { name: `${projectName} Updated`, description: "Updated description" };
    const res = await app.inject({ method: "PATCH", url: `/projects/${projectId}`, payload: updated });
    expect(res.statusCode).toBe(200);
    const proj = JSON.parse(res.body);
    expect(proj.name).toBe(updated.name);
    expect(proj.description).toBe(updated.description);
  });

  test("/projects/:id (PATCH) - not found", async () => {
    const res = await app.inject({ method: "PATCH", url: "/projects/999999", payload: { name: "X" } });
    expect(res.statusCode).toBe(404);
  });

  test("/projects/:id/:promotionId/status (PATCH) - should update project status", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/projects/${projectId}/${promotionIds[0]}/status`,
      payload: { status: ProjectStatus.VISIBLE },
    });
    expect(res.statusCode).toBe(200);
  });

  test("/projects/:id (DELETE) - should soft-delete the project", async () => {
    const res = await app.inject({ method: "DELETE", url: `/projects/${projectId}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.deleted).toBe(true);

    const getRes = await app.inject({ method: "GET", url: `/projects/${projectId}` });
    expect(getRes.statusCode).toBe(404);
  });

  test("/projects/:id (DELETE) - not found", async () => {
    const res = await app.inject({ method: "DELETE", url: "/projects/999999" });
    expect(res.statusCode).toBe(404);
  });

  afterAll(async () => {
    if (projectId) {
      await prisma.groupMember.deleteMany({
        where: {
          group: {
            projectId: projectId,
          },
        },
      });
      await prisma.group.deleteMany({
        where: { projectId },
      });
      await prisma.groupSettings.deleteMany({
        where: { projectId },
      });
      await prisma.projectPromotion.deleteMany({
        where: { projectId },
      });
      await prisma.project.delete({
        where: { id: projectId },
      });
    }
    if (promotionIds.length) {
      await prisma.promotion.deleteMany({
        where: { id: { in: promotionIds } },
      });
    }
    await app.close();
  });
});
