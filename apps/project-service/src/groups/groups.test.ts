import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { GroupMode, ProjectStatus } from "@prisma-project/client";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";
import { CreateGroupDto, GroupSettingsDto, UpdateGroupDto } from "./dto/group.dto";

describe("Groups API", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectId: number;
  let promotionId: number;
  let createdGroupIds: number[];
  const now = Date.now();
  const deadline = new Date(now + 7 * 24 * 3600 * 1000).toISOString();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);

    const promo = await prisma.promotion.create({
      data: { name: `Promo ${now}`, description: "for groups", creatorId: 1 },
    });
    promotionId = promo.id;

    const proj = await prisma.project.create({
      data: { name: `Proj ${now}`, description: "for groups", creatorId: 1 },
    });
    projectId = proj.id;

    await prisma.projectPromotion.create({
      data: { projectId, promotionId, status: ProjectStatus.DRAFT },
    });

    await prisma.groupSettings.create({
      data: {
        projectId,
        promotionId,
        minMembers: 2,
        maxMembers: 4,
        mode: GroupMode.MANUAL,
        deadline: new Date(deadline),
      },
    });
  });

  test("POST /projects/:projectId/promotions/:promotionId/groups — create groups skeleton", async () => {
    const dto: CreateGroupDto = { numberOfGroups: 3, baseName: "Team" };

    const res = await app.inject({
      method: "POST",
      url: `/projects/${projectId}/promotions/${promotionId}/groups`,
      payload: dto,
    });
    expect(res.statusCode).toBe(201);

    const groups = await prisma.group.findMany({
      where: { projectId, promotionId },
      orderBy: { id: "asc" },
    });
    expect(groups.length).toBe(3);

    createdGroupIds = groups.map((g) => g.id);
    expect(groups[0].name).toBe("Team 1");
  });

  test("GET /projects/:projectId/promotions/:promotionId/groups — list groups", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/promotions/${promotionId}/groups`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(createdGroupIds.length);
    expect(body[0]).toHaveProperty("members");
    expect(Array.isArray(body[0].members)).toBe(true);
  });

  test("PUT /groups/:id — update group name", async () => {
    const firstId = createdGroupIds[0];
    const update: UpdateGroupDto = { name: "NewName" };
    const res = await app.inject({
      method: "PUT",
      url: `/groups/${firstId}`,
      payload: update,
    });
    expect(res.statusCode).toBe(200);
    const updated = await prisma.group.findUnique({ where: { id: firstId } });
    expect(updated?.name).toBe("NewName");
  });

  test("POST /groups/:id/students — add members", async () => {
    const groupId = createdGroupIds[0];
    const studentIds = [101, 102];
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/students`,
      payload: { studentIds },
    });
    expect(res.statusCode).toBe(200);

    const members = await prisma.groupMember.findMany({ where: { groupId } });
    expect(members.map((m) => m.studentId)).toEqual(expect.arrayContaining(studentIds));
  });

  test("DELETE /groups/:id/students/:userId — remove one member", async () => {
    const groupId = createdGroupIds[0];
    const removeId = 101;
    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}/students/${removeId}`,
    });
    expect(res.statusCode).toBe(200);

    const still = await prisma.groupMember.findMany({ where: { groupId } });
    expect(still.find((m) => m.studentId === removeId)).toBeUndefined();
  });

  test("GET /projects/:projectId/promotions/:promotionId/group-settings — get settings", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/projects/${projectId}/promotions/${promotionId}/group-settings`,
    });
    expect(res.statusCode).toBe(200);
    const body: GroupSettingsDto = JSON.parse(res.body);
    expect(body.minMembers).toBe(2);
    expect(body.mode as GroupMode).toBe(GroupMode.MANUAL);
  });

  test("PATCH /projects/:projectId/promotions/:promotionId/group-settings — update settings", async () => {
    const newDeadline = new Date(now + 15 * 24 * 3600 * 1000).toISOString();
    const res = await app.inject({
      method: "PATCH",
      url: `/projects/${projectId}/promotions/${promotionId}/group-settings`,
      payload: { minMembers: 3, maxMembers: 5, mode: GroupMode.RANDOM, deadline: newDeadline },
    });
    expect(res.statusCode).toBe(200);

    const settings = await prisma.groupSettings.findUnique({
      where: { projectId_promotionId: { projectId, promotionId } },
    });
    expect(settings?.minMembers).toBe(3);
    expect(settings?.mode).toBe(GroupMode.RANDOM);
  });

  test("DELETE /groups/:id — delete a group", async () => {
    const groupId = createdGroupIds[1];
    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}`,
    });
    expect(res.statusCode).toBe(200);

    const gone = await prisma.group.findUnique({ where: { id: groupId } });
    expect(gone).toBeNull();
  });

  afterAll(async () => {
    await prisma.groupMember.deleteMany({
      where: { groupId: { in: createdGroupIds } },
    });
    await prisma.group.deleteMany({
      where: { id: { in: createdGroupIds } },
    });
    await prisma.groupSettings.deleteMany({
      where: { projectId, promotionId },
    });
    await prisma.projectPromotion.deleteMany({
      where: { projectId, promotionId },
    });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.promotion.delete({ where: { id: promotionId } });
    await app.close();
  });
});
