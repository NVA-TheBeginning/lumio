import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service";
import { CreateReportDto, CreateReportSectionDto } from "@/reports/reports.dto";

describe("Reports", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let reportId: number;
  let sectionId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  const createReportDto = (): CreateReportDto => ({
    projectId: 1,
    groupId: 1,
    sections: [
      {
        title: "Introduction",
        contentMarkdown: "# Introduction\nThis is the introduction section.",
        contentHtml: "<h1>Introduction</h1><p>This is the introduction section.</p>",
      },
      {
        title: "Methodology",
        contentMarkdown: "## Methodology\nOur approach was systematic.",
        contentHtml: "<h2>Methodology</h2><p>Our approach was systematic.</p>",
      },
    ],
  });

  const createReportSectionDto = (): CreateReportSectionDto => ({
    title: "Conclusion",
    contentMarkdown: "## Conclusion\nThis is our conclusion.",
    contentHtml: "<h2>Conclusion</h2><p>This is our conclusion.</p>",
  });

  test("/reports (POST) - should create a new report with sections", async () => {
    const reportDto = createReportDto();
    const response = await app.inject({
      method: "POST",
      url: "/reports",
      payload: reportDto,
    });

    expect(response.statusCode).toEqual(201);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("projectId", reportDto.projectId);
    expect(body).toHaveProperty("groupId", reportDto.groupId);
    expect(body).toHaveProperty("sections");
    expect(body.sections).toHaveLength(2);
    expect(body.sections[0]).toHaveProperty("title", "Introduction");
    expect(body.sections[1]).toHaveProperty("title", "Methodology");

    reportId = body.id;
  });

  test("/reports (POST) - should fail when missing required fields", async () => {
    const invalidReportDto = {
      groupId: 1,
      sections: [],
    };

    const response = await app.inject({
      method: "POST",
      url: "/reports",
      payload: invalidReportDto,
    });

    expect(response.statusCode).toEqual(400);
    const body = JSON.parse(response.body);
    console.log(body);
    expect(body.message).toContain("projectId");
  });

  test("/reports (GET) - should return all reports", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports",
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("projectId");
    expect(body[0]).toHaveProperty("sections");
  });

  test("/reports (GET) - should filter reports by projectId", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports?projectId=1",
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  test("/reports (GET) - should filter reports by groupId", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports?groupId=1",
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  test("/reports (GET) - should filter reports by both projectId and groupId", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports?projectId=1&groupId=1",
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  test("/reports/:id (GET) - should return the report by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/reports/${reportId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", reportId);
    expect(body).toHaveProperty("projectId", 1);
    expect(body).toHaveProperty("sections");
    expect(body.sections).toHaveLength(2);
  });

  test("/reports/:id (GET) - should return 404 for non-existent report", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports/999999",
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report with ID 999999 not found");
  });

  test("/reports/:id (PATCH) - should update a report", async () => {
    const updateDto = {
      projectId: 1,
      groupId: 1,
      sections: [
        {
          title: "Updated Introduction",
          contentMarkdown: "# Updated Introduction\nThis is updated.",
          contentHtml: "<h1>Updated Introduction</h1><p>This is updated.</p>",
        },
      ],
    };

    const response = await app.inject({
      method: "PATCH",
      url: `/reports/${reportId}`,
      payload: updateDto,
    });

    expect(response.statusCode).toEqual(200);
  });

  test("/reports/:id (PATCH) - should update report sections", async () => {
    const updateDto = {
      sections: [
        {
          title: "Updated Introduction",
          contentMarkdown: "# Updated Introduction\nThis is updated.",
        },
      ],
    };

    const response = await app.inject({
      method: "PATCH",
      url: `/reports/${reportId}`,
      payload: updateDto,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body.sections).toHaveLength(1);
    expect(body.sections[0]).toHaveProperty("title", "Updated Introduction");
  });

  test("/reports/:id (PATCH) - should return 404 for non-existent report", async () => {
    const updateDto = { projectId: 1 };

    const response = await app.inject({
      method: "PATCH",
      url: "/reports/999999",
      payload: updateDto,
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report with ID 999999 not found");
  });

  test("/reports/:id/sections (POST) - should add a section to a report", async () => {
    const sectionDto = createReportSectionDto();
    const response = await app.inject({
      method: "POST",
      url: `/reports/${reportId}/sections`,
      payload: sectionDto,
    });

    expect(response.statusCode).toEqual(201);
    const body = JSON.parse(response.body);
    expect(body.sections).toHaveLength(2);
    const newSection = body.sections.find((s: { title: string }) => s.title === "Conclusion");
    expect(newSection).toBeDefined();
    sectionId = newSection.id;
  });

  test("/reports/:id/sections (POST) - should return 404 for non-existent report", async () => {
    const sectionDto = createReportSectionDto();
    const response = await app.inject({
      method: "POST",
      url: "/reports/999999/sections",
      payload: sectionDto,
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report with ID 999999 not found");
  });

  test("/reports/sections/:sectionId (PATCH) - should update a section", async () => {
    const updateSectionDto = {
      title: "Updated Conclusion",
      contentMarkdown: "## Updated Conclusion\nThis is the updated conclusion.",
      contentHtml: "<h2>Updated Conclusion</h2><p>This is the updated conclusion.</p>",
    };

    const response = await app.inject({
      method: "PATCH",
      url: `/reports/sections/${sectionId}`,
      payload: updateSectionDto,
    });

    expect(response.statusCode).toEqual(204);

    const reportResponse = await app.inject({
      method: "GET",
      url: `/reports/${reportId}`,
    });
    const reportBody = JSON.parse(reportResponse.body);
    const updatedSection = reportBody.sections.find((s: { id: number }) => s.id === sectionId);
    expect(updatedSection).toHaveProperty("title", "Updated Conclusion");
  });

  test("/reports/sections/:sectionId (PATCH) - should return 404 for non-existent section", async () => {
    const updateSectionDto = { title: "Updated Title" };

    const response = await app.inject({
      method: "PATCH",
      url: "/reports/sections/999999",
      payload: updateSectionDto,
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report section with ID 999999 not found");
  });

  test("/reports/sections/:sectionId (DELETE) - should delete a section", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/reports/sections/${sectionId}`,
    });

    expect(response.statusCode).toEqual(204);

    const reportResponse = await app.inject({
      method: "GET",
      url: `/reports/${reportId}`,
    });
    const reportBody = JSON.parse(reportResponse.body);
    const deletedSection = reportBody.sections.find((s: { id: number }) => s.id === sectionId);
    expect(deletedSection).toBeUndefined();
  });

  test("/reports/sections/:sectionId (DELETE) - should return 404 for non-existent section", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/reports/sections/999999",
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report section with ID 999999 not found");
  });

  test("/reports (GET) - should handle invalid query parameters gracefully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports?projectId=invalid&groupId=invalid",
    });

    expect(response.statusCode).toEqual(400);
  });

  test("/reports/:id (GET) - should handle invalid ID format", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/reports/invalid-id",
    });

    expect(response.statusCode).toEqual(400);
  });

  test("/reports/:id (DELETE) - should delete a report", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/reports/${reportId}`,
    });

    expect(response.statusCode).toEqual(204);

    const getResponse = await app.inject({
      method: "GET",
      url: `/reports/${reportId}`,
    });
    expect(getResponse.statusCode).toEqual(404);
  });

  test("/reports/:id (DELETE) - should return 404 for non-existent report", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/reports/999999",
    });

    expect(response.statusCode).toEqual(404);
    const body = JSON.parse(response.body);
    expect(body.message).toContain("Report with ID 999999 not found");
  });

  afterAll(async () => {
    await prisma.reportSection.deleteMany({
      where: {
        report: {
          projectId: { in: [1, 2, 3] },
        },
      },
    });
    await prisma.report.deleteMany({
      where: {
        projectId: { in: [1, 2, 3] },
      },
    });
    await app.close();
  });
});
