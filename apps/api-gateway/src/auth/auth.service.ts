// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { jwtConstants } from "@/auth/constants.js";
import { User } from "@/users/user.interface.js";
import { UsersService } from "@/users/users.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Valide l'utilisateur en comparant son email et son mot de passe.
   * Utilise bcrypt pour comparer le mot de passe hashé stocké en base.
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.usersService.findByEmail(email);
    console.log("User:", user);
    if (user && (await bcrypt.compare(pass, <string>user.password_hash))) {
      // On exclut le hash du mot de passe avant de retourner l'utilisateur
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Connecte l'utilisateur et génère un access token et un refresh token.
   */
  async login(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { sub: user.id, username: user.email };
    // Génération d'un token d'accès avec une durée de vie courte
    const accessToken = this.jwtService.sign(payload, { expiresIn: jwtConstants.accessTokenExpiresIn });
    // Génération d'un refresh token avec une durée de vie plus longue
    const refreshToken = this.jwtService.sign(payload, { expiresIn: jwtConstants.refreshTokenExpiresIn });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Vérifie le refresh token et génère un nouveau token d'accès.
   * En cas d'invalidité du refresh token, une exception Unauthorized est levée.
   */
  async refreshToken(oldRefreshToken: string): Promise<{ access_token: string }> {
    try {
      // Vérifie et décode le refresh token
      const payload = this.jwtService.verify(oldRefreshToken, { secret: jwtConstants.secret });
      // Génère un nouveau token d'accès
      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username },
        { expiresIn: jwtConstants.accessTokenExpiresIn },
      );
      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException("Refresh token invalide");
    }
  }
}
