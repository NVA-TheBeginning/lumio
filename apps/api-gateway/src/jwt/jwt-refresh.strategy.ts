import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "@/config/constants.js";

interface JwtRefreshPayload {
  sub: number;
  email: string;
  type: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<{ id: number; email: string }> {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return { id: payload.sub, email: payload.email };
  }
}
