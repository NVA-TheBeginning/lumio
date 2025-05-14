import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { Test } from "@nestjs/testing";
import { FastifyRequest } from "fastify";
import { AuthController } from "@/microservices/auth/auth.controller.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { JwtStrategy } from "./jwt.strategy.js";

describe("Jwt Strategies", () => {
  test("should be defined", () => {
    expect(JwtStrategy).toBeDefined();
  });

  describe("JwtStrategy", () => {
    let strategy: JwtStrategy;

    beforeEach(() => {
      strategy = new JwtStrategy();
    });

    test("should validate and extract user data from JWT payload", async () => {
      const payload = {
        sub: 1,
        email: "user@example.com",
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: "user@example.com",
      });
    });
  });
});

describe("AuthController", () => {
  let controller: AuthController;
  let proxyService: MicroserviceProxyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: MicroserviceProxyService,
          useValue: {
            forwardRequest: mock(() => {}),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    proxyService = module.get<MicroserviceProxyService>(MicroserviceProxyService);
  });

  test("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    test("should forward login request to auth service", async () => {
      const loginDto = { email: "test@example.com", password: "password" };
      const mockResponse = { token: "jwt-token", refreshToken: "refresh-token" };

      spyOn(proxyService, "forwardRequest").mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(proxyService.forwardRequest).toHaveBeenCalledWith("auth", "/auth/login", "POST", loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("refresh", () => {
    test("should forward refresh token request to auth service", async () => {
      const mockResponse = { token: "new-jwt-token", refreshToken: "new-refresh-token" };

      spyOn(proxyService, "forwardRequest").mockResolvedValue(mockResponse);

      const req = { refreshToken: "some-refresh-token" } as FastifyRequest & { refreshToken: string };

      const result = await controller.refresh(req);

      expect(proxyService.forwardRequest).toHaveBeenCalledWith("auth", "/auth/refresh", "POST", {
        refreshToken: "some-refresh-token",
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
