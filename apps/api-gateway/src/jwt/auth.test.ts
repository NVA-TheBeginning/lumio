import { beforeEach, describe, expect, test } from "bun:test";
import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy.js";
import { JwtRefreshStrategy } from "./jwt-refresh.strategy.js";

describe("Auth Strategies", () => {
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
