import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService, AuthTokens } from "@/auth/auth.service";
import { PrismaService } from "@/prisma.service.js";

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async handleGoogle(token: string): Promise<AuthTokens> {
    const email = await this.verifyGoogleToken(token);
    return this.findOrCreateUser(email);
  }

  async handleMicrosoft(token: string): Promise<AuthTokens> {
    const email = await this.verifyMicrosoftToken(token);
    return this.findOrCreateUser(email);
  }

  private async findOrCreateUser(email: string): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          password: await Bun.password.hash(Bun.randomUUIDv7()),
        },
      });
    }

    return this.authService.generateTokens(user.id, user.email);
  }

  private async verifyGoogleToken(token: string): Promise<string> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as { email: string };

      return data.email;
    } catch {
      throw new UnauthorizedException("Invalid Google token");
    }
  }

  private async verifyMicrosoftToken(token: string): Promise<string> {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as { mail: string; userPrincipalName: string };
      return data.mail || data.userPrincipalName;
    } catch {
      throw new UnauthorizedException("Invalid Microsoft token");
    }
  }
}
