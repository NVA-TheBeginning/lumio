import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { OAuthService } from "./oauth.service";

describe("OAuth", () => {
  let app: NestFastifyApplication;
  const dummyGoogleToken = "dummy-google-token";
  const dummyMicrosoftToken = "dummy-microsoft-token";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OAuthService)
      .useValue({
        handleGoogle: mock(async (token: string) => {
          if (token === dummyGoogleToken) {
            return {
              accessToken: "mock-access-token",
              refreshToken: "mock-refresh-token",
            };
          }
          throw new Error("Invalid token");
        }),
        handleMicrosoft: mock(async (token: string) => {
          if (token === dummyMicrosoftToken) {
            return {
              accessToken: "mock-access-token",
              refreshToken: "mock-refresh-token",
            };
          }
          throw new Error("Invalid token");
        }),
      })
      .compile();

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
    await app.close();
  });
});
