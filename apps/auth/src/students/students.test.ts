import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";
import { CreateStudentDto } from "@/students/dto/students.dto";

describe("Students", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let studentId: number;
  const testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  const createStudentDtos: CreateStudentDto[] = [
    {
      firstname: "John",
      lastname: "Doe",
      email: testEmail,
    },
  ];

  test("/students (POST) - should create new students", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/students",
      payload: createStudentDtos,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("count", createStudentDtos.length);
    expect(body.students[0]).toHaveProperty("email", createStudentDtos[0].email);
    expect(body.students[0]).toHaveProperty("studentId");
    studentId = body.students[0].studentId;
  });

  test("/students/:id (GET) - should return a specific student", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/students/${studentId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", studentId);
    expect(body).toHaveProperty("email", createStudentDtos[0].email);
  });

  test("/students/:id (PATCH) - should update a specific student", async () => {
    const updateData = { firstname: "Updated John" };
    const response = await app.inject({
      method: "PATCH",
      url: `/students/${studentId}`,
      payload: updateData,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", studentId);
    expect(body).toHaveProperty("firstname", updateData.firstname);
  });

  test("/students/:id/password (PATCH) - should update a student's password", async () => {
    const updatePasswordDto = { newPassword: "newPassword123" };
    const response = await app.inject({
      method: "PATCH",
      url: `/students/${studentId}/password`,
      payload: updatePasswordDto,
    });

    expect(response.statusCode).toEqual(200);
  });

  test("/students/:id (DELETE) - should delete a specific student", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/students/${studentId}`,
    });

    expect(response.statusCode).toEqual(200);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });
    expect(student).toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});
