// src/oauth/oauth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import axios from "axios";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma.service.js";

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async handleGoogle(token: string) {
    const email = await this.verifyGoogleToken(token);
    return this.findOrCreateUser(email);
  }

  async handleMicrosoft(token: string) {
    const email = await this.verifyMicrosoftToken(token);
    return this.findOrCreateUser(email);
  }

  private async findOrCreateUser(email: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, password: "" }, // pas de mot de passe dans ce cas
      });
    }

    return this.authService.generateTokens(user.id, user.email);
  }

  private async verifyGoogleToken(token: string): Promise<string> {
    try {
      const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
      return data.email;
    } catch {
      throw new UnauthorizedException("Invalid Google token");
    }
  }

  private async verifyMicrosoftToken(token: string): Promise<string> {
    try {
      const { data } = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.mail || data.userPrincipalName;
    } catch {
      throw new UnauthorizedException("Invalid Microsoft token");
    }
  }
}
