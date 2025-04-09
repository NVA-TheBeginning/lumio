import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";

describe("Auth", () => {
  let app: NestFastifyApplication;
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  test("/auth/signup (POST) - should register a new user", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email, password },
    });
    expect(response.statusCode).toEqual(201);
    const body = JSON.parse(response.body);
    // Le endpoint signup ne renvoie qu'un message
    expect(body).toEqual({ message: "User successfully registered" });
  });

  test("/auth/signup (POST) - should return 409 if email already exists", async () => {
    // Première inscription
    await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email, password },
    });
    // Deuxième tentative avec le même email
    const response = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email, password },
    });
    expect(response.statusCode).toEqual(409);
  });

  test("/auth/login (POST) - should login existing user", async () => {
    // Inscription préalable
    await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email, password },
    });
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    // On s'attend à recevoir un objet AuthLogin :
    // { id, email, firstname, lastname, role, accessToken, refreshToken }
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("email", email);
    expect(body).toHaveProperty("firstname");
    expect(body).toHaveProperty("lastname");
    expect(body).toHaveProperty("role");
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");
  });

  test("/auth/login (POST) - should return 401 for invalid credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nonexistent@example.com", password: "wrong-password" },
    });
    expect(response.statusCode).toEqual(401);
  });

  test("/auth/login (POST) - should return 401 for wrong password", async () => {
    // Inscription préalable
    await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email, password: "correct-password" },
    });
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "wrong-password" },
    });
    expect(response.statusCode).toEqual(401);
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({ where: { email } });
    await app.close();
  });
});