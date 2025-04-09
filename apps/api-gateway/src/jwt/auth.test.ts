import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyRequest } from "fastify";
import { AuthController } from "@/microservices/auth/auth.controller.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { JwtRefreshStrategy } from "./jwt-refresh.strategy.js";

describe("Jwt Strategies", () => {
  test("should be defined", () => {
    expect(JwtStrategy).toBeDefined();
    expect(JwtRefreshStrategy).toBeDefined();
  });

  describe("JwtRefreshStrategy", () => {
    let strategy: JwtRefreshStrategy;

    beforeEach(() => {
      strategy = new JwtRefreshStrategy();
    });

    test("should validate and extract user data from JWT refresh payload", async () => {
      const payload = {
        sub: 1,
        email: "user@example.com",
        type: "refresh",
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: "user@example.com",
      });
    });

    test("should throw UnauthorizedException for invalid token type", async () => {
      const payload = {
        sub: 1,
        email: "user@example.com",
        type: "access",
      };

      try {
        await strategy.validate(payload);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).message).toBe("Invalid refresh token");
      }
    });
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
      const simulatedUser = { id: 1, email: "test@example.com" };

      const mockResponse = { token: "new-jwt-token", refreshToken: "new-refresh-token" };

      spyOn(proxyService, "forwardRequest").mockResolvedValue(mockResponse);

      const req = { user: simulatedUser } as unknown as FastifyRequest & { user: typeof simulatedUser };

      const result = await controller.refresh(req);

      expect(proxyService.forwardRequest).toHaveBeenCalledWith("auth", "/auth/refresh", "POST", simulatedUser);
      expect(result).toEqual(mockResponse);
    });
  });
});
