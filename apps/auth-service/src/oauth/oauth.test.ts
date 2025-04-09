// tests/oauth.test.ts

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import nock from "nock";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";

describe("OAuth", () => {
  let app: NestFastifyApplication;
  const dummyGoogleToken = "dummy-google-token";
  const dummyMicrosoftToken = "dummy-microsoft-token";

  beforeAll(async () => {
    nock("https://www.googleapis.com")
      .get("/oauth2/v3/tokeninfo")
      .query({ id_token: dummyGoogleToken })
      .reply(200, { email: "google.user@example.com" });

    nock("https://graph.microsoft.com")
      .get("/v1.0/me")
      .matchHeader("Authorization", `Bearer ${dummyMicrosoftToken}`)
      .reply(200, {
        mail: "microsoft.user@example.com",
        userPrincipalName: "microsoft.user@example.com",
      });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  test("/auth/oauth/google (POST) - should authenticate using Google OAuth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/oauth/google",
      payload: { token: dummyGoogleToken },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);
    // On attend à recevoir des tokens JWT
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");
  });

  test("/auth/oauth/microsoft (POST) - should authenticate using Microsoft OAuth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/oauth/microsoft",
      payload: { token: dummyMicrosoftToken },
    });

    expect(response.statusCode).toEqual(200);
    const body = JSON.parse(response.body);

    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({});
    await app.close();
    nock.cleanAll();
  });
});
