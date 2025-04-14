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
  let promotionIds: number[] = [];

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

    for (const promotionData of promotionsData) {
      const promotion = await prisma.promotion.create({
        data: promotionData,
      });
      promotionIds.push(promotion.id);
    }
  });

  const createGroupSettings = (promotionIds: number[]): GroupSettingDto[] => {
    return promotionIds.map((promotionId) => ({
      promotionId,
      minMembers: 2,
      maxMembers: 5,
      mode: GroupMode.FREE,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const createProjectDto = (): CreateProjectDto => ({
    name: projectName,
    description: "A test project",
    creatorId: 1,
    promotionIds: promotionIds,
    groupSettings: createGroupSettings(promotionIds),
  });

  test("/projects (POST) - should create a new project with group settings", async () => {
    const projectDto = createProjectDto();
    const response = await app.inject({
      method: "POST",
      url: "/projects",
      payload: projectDto,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("name", projectDto.name);
    expect(body).toHaveProperty("description", projectDto.description);
    projectId = body.id;

    const projectPromotions = await prisma.projectPromotion.findMany({
      where: {
        projectId: projectId,
      },
    });

    expect(projectPromotions.length).toEqual(promotionIds.length);
    expect(projectPromotions[0].status).toEqual(ProjectStatus.DRAFT);

    const groupSettings = await prisma.groupSettings.findMany({
      where: {
        projectId: projectId,
      },
    });

    expect(groupSettings.length).toEqual(promotionIds.length);
    for (const setting of groupSettings) {
      expect(setting.minMembers).toEqual(2);
      expect(setting.maxMembers).toEqual(5);
      expect(setting.mode).toEqual(GroupMode.FREE);
      expect(setting.deadline).toBeDefined();
    }
  });

  test("/projects (POST) - should fail with invalid promotion ids", async () => {
    const invalidProjectDto = {
      ...createProjectDto(),
      promotionIds: [999999],
      groupSettings: createGroupSettings([999999]),
    };

    const response = await app.inject({
      method: "POST",
      url: "/projects",
      payload: invalidProjectDto,
    });

    expect(response.statusCode).toEqual(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("One or more promotions do not exist");
  });

  test("/projects (POST) - should fail with invalid group settings (minMembers > maxMembers)", async () => {
    const invalidGroupSettingsDto = {
      ...createProjectDto(),
      groupSettings: promotionIds.map((promotionId) => ({
        promotionId,
        minMembers: 10,
        maxMembers: 5,
        mode: GroupMode.FREE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })),
    };

    const response = await app.inject({
      method: "POST",
      url: "/projects",
      payload: invalidGroupSettingsDto,
    });

    expect(response.statusCode).toEqual(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("minMembers cannot be greater than maxMembers");
  });

  afterAll(async () => {
    if (projectId) {
      await prisma.groupSettings.deleteMany({
        where: {
          projectId: projectId,
        },
      });

      await prisma.projectPromotion.deleteMany({
        where: {
          projectId: projectId,
        },
      });

      await prisma.project.delete({
        where: {
          id: projectId,
        },
      });
    }

    for (const promotionId of promotionIds) {
      await prisma.promotion.delete({
        where: {
          id: promotionId,
        },
      });
    }

    await app.close();
  });
});
