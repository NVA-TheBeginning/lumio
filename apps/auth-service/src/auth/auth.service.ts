import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createSigner, createVerifier } from "fast-jwt";
import { PrismaService } from "@/prisma.service.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLogin {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  AuthTokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly accessSigner;
  private readonly refreshSigner;
  private readonly verifier;

  constructor(private prisma: PrismaService) {
    this.accessSigner = createSigner({
      key: process.env.JWT_SECRET || "your-secret-key",
      expiresIn: 86400, // 1 day
    });

    this.refreshSigner = createSigner({
      key: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
      expiresIn: "7d",
    });

    this.verifier = createVerifier({
      key: process.env.JWT_REFRESH_SECRET || "refresh-secret",
    });
  }

  async signUp(email: string, password: string): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: await Bun.password.hash(password),
      },
    });

    return this.generateTokens(newUser.id, newUser.email);
  }

  async signIn(email: string, password: string): Promise<AuthLogin> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await Bun.password.verify(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = this.generateTokens(user.id, user.email);
    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      role: user.role,
      AuthTokens: tokens,
    };
  }

  async refreshToken(id: number, email: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.generateTokens(id, email);
  }

  generateTokens(userId: number, email: string): AuthTokens {
    const accessToken = this.accessSigner({ sub: userId, email, type: "access" });
    const refreshToken = this.refreshSigner({ sub: userId, email, type: "refresh" });
    return { accessToken, refreshToken };
  }
}
