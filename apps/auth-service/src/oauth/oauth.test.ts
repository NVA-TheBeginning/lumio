import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/prisma.service.js";

describe("OAuth", () => {
  let app: NestFastifyApplication;
  const dummyGoogleToken = "dummy-google-token";
  const dummyMicrosoftToken = "dummy-microsoft-token";

  beforeAll(async () => {
    spyOn(axios, "get").mockImplementation((async (
      url: string,
      config?: AxiosRequestConfig<any>,
    ): Promise<AxiosResponse<any>> => {
      if (url.startsWith("https://www.googleapis.com/oauth2/v3/tokeninfo")) {
        const queryString = url.split("?")[1] || "";
        const queryParams = new URLSearchParams(queryString);
        if (queryParams.get("id_token") === dummyGoogleToken) {
          return Promise.resolve({ data: { email: "google.user@example.com" } } as AxiosResponse<any>);
        } else {
          return Promise.reject(new Error("Invalid Google token"));
        }
      }

      if (url.startsWith("https://graph.microsoft.com/v1.0/me")) {
        if (config && config.headers && config.headers.Authorization === `Bearer ${dummyMicrosoftToken}`) {
          return Promise.resolve({
            data: {
              mail: "microsoft.user@example.com",
              userPrincipalName: "microsoft.user@example.com",
            },
          } as AxiosResponse<any>);
        } else {
          return Promise.reject(new Error("Invalid Microsoft token"));
        }
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as any);

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
  });
});
