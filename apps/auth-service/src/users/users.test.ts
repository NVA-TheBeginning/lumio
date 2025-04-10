import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";
import { CreateStudentDto } from "@/users/dto/students.dto";

describe("Users", () => {
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

  test("/users/students (POST) - should create new students", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users/students",
      payload: createStudentDtos,
    });

    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("count", createStudentDtos.length);
    expect(body.students[0]).toHaveProperty("email", createStudentDtos[0].email);
    expect(body.students[0]).toHaveProperty("studentId");
    studentId = body.students[0].studentId;
  });

  test("/users/:id (GET) - should return a specific user", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/users/${studentId}`,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", studentId);
    expect(body).toHaveProperty("email", createStudentDtos[0].email);
  });

  test("/users/:id (PATCH) - should update a specific user", async () => {
    const updateData = { firstname: "Updated John" };
    const response = await app.inject({
      method: "PATCH",
      url: `/users/${studentId}`,
      payload: updateData,
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("id", studentId);
    expect(body).toHaveProperty("firstname", updateData.firstname);
  });

  test("/users/:id/password (PATCH) - should update a user's password", async () => {
    const updatePasswordDto = { newPassword: "newPassword123" };
    const response = await app.inject({
      method: "PATCH",
      url: `/users/${studentId}/password`,
      payload: updatePasswordDto,
    });

    expect(response.statusCode).toEqual(200);
  });

  test("/users/:id (DELETE) - should delete a specific user", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/users/${studentId}`,
    });

    expect(response.statusCode).toEqual(200);

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });
    expect(user).toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});
