import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { ExecutionContext, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "./auth.guard.js";

const mockJwtConstants = {
  secret: "test-secret-key-minimum-32-characters-long",
  expiresIn: "1h",
  issuer: "test-issuer",
  audience: "test-audience",
};

mock.module("@/config/constants", () => ({
  jwtConstants: mockJwtConstants,
}));

const mockLogger = mock(() => ({}));
spyOn(Logger.prototype, "error").mockImplementation(mockLogger);

interface MockRequest extends Partial<FastifyRequest> {
  headers: Record<string, string>;
  user?: {
    sub: number;
    email: string;
    role: "TEACHER" | "STUDENT" | "ADMIN" | string;
    type: string;
    iat?: number;
    exp?: number;
  };
}

interface MockJwtService {
  verifyAsync: ReturnType<typeof mock>;
}

interface MockExecutionContext {
  switchToHttp: ReturnType<typeof mock>;
}

describe("AuthGuard", () => {
  let authGuard: AuthGuard;
  let jwtService: MockJwtService;
  let mockExecutionContext: MockExecutionContext;
  let mockRequest: MockRequest;

  beforeEach(() => {
    jwtService = {
      verifyAsync: mock(() => Promise.resolve({})),
    };

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockExecutionContext = {
      switchToHttp: mock(() => ({
        getRequest: mock(() => mockRequest),
      })),
    };

    authGuard = new AuthGuard(jwtService as unknown as JwtService);
  });

  describe("canActivate", () => {
    it("should throw UnauthorizedException when no authorization header is provided", async () => {
      mockRequest.headers = {};

      expect(authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when authorization header is malformed", async () => {
      mockRequest.headers = {
        authorization: "InvalidHeader",
      };

      expect(authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when token is invalid", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      (jwtService.verifyAsync as ReturnType<typeof mock>).mockRejectedValue(new Error("Invalid token"));

      expect(authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should return true and set user when token is valid", async () => {
      const mockPayload = {
        sub: 123,
        email: "test@example.com",
        role: "STUDENT" as const,
        type: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (jwtService.verifyAsync as ReturnType<typeof mock>).mockResolvedValue(mockPayload);

      const result = await authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid-token", {
        secret: mockJwtConstants.secret,
      });
    });

    it("should handle TEACHER role correctly", async () => {
      const teacherPayload = {
        sub: 456,
        email: "teacher@example.com",
        role: "TEACHER" as const,
        type: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.headers = {
        authorization: "Bearer teacher-token",
      };

      (jwtService.verifyAsync as ReturnType<typeof mock>).mockResolvedValue(teacherPayload);

      const result = await authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user?.role).toBe("TEACHER");
    });

    it("should handle ADMIN role correctly", async () => {
      const adminPayload = {
        sub: 789,
        email: "admin@example.com",
        role: "ADMIN" as const,
        type: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.headers = {
        authorization: "Bearer admin-token",
      };

      (jwtService.verifyAsync as ReturnType<typeof mock>).mockResolvedValue(adminPayload);

      const result = await authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user?.role).toBe("ADMIN");
    });

    it("should handle custom string roles", async () => {
      const customPayload = {
        sub: 999,
        email: "custom@example.com",
        role: "CUSTOM_ROLE",
        type: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.headers = {
        authorization: "Bearer custom-token",
      };

      (jwtService.verifyAsync as ReturnType<typeof mock>).mockResolvedValue(customPayload);

      const result = await authGuard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user?.role).toBe("CUSTOM_ROLE");
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer authorization header", () => {
      const request = {
        headers: {
          authorization: "Bearer my-jwt-token",
        },
      };

      const token = (
        authGuard as unknown as { extractTokenFromHeader: (req: MockRequest) => string | undefined }
      ).extractTokenFromHeader(request);
      expect(token).toBe("my-jwt-token");
    });

    it("should return undefined for non-Bearer authorization", () => {
      const request = {
        headers: {
          authorization: "Basic username:password",
        },
      };

      const token = (
        authGuard as unknown as { extractTokenFromHeader: (req: MockRequest) => string | undefined }
      ).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it("should return undefined when no authorization header", () => {
      const request = {
        headers: {},
      };

      const token = (
        authGuard as unknown as { extractTokenFromHeader: (req: MockRequest) => string | undefined }
      ).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it("should return undefined for malformed Bearer header", () => {
      const request = {
        headers: {
          authorization: "Bearer",
        },
      };

      const token = (
        authGuard as unknown as { extractTokenFromHeader: (req: MockRequest) => string | undefined }
      ).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });
  });
});
