// src/auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "@/auth/constants.js";

interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<{ userId: number; username: string }> {
    // La fonction validate est appelée après vérification du JWT.
    // Le payload contient par exemple : { sub: userId, username: userEmail }.
    // On renvoie un objet minimal qui sera attaché à req.user.
    return { userId: payload.sub, username: payload.username };
  }
}
