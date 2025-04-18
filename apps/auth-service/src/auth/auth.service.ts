import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { createSigner, createVerifier } from "fast-jwt";
import { PrismaService } from "@/prisma.service.js";

export class AuthTokens {
  @ApiProperty({ example: "eyJhbGciOi..." })
  accessToken!: string;

  @ApiProperty({ example: "eyJhbGciOi..." })
  refreshToken!: string;
}

export class AuthLogin {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Marie" })
  firstname!: string;

  @ApiProperty({ example: "Dupont" })
  lastname!: string;

  @ApiProperty({ example: "STUDENT", enum: ["STUDENT", "TEACHER", "ADMIN"] })
  role!: string;

  @ApiProperty({ type: () => AuthTokens })
  tokens!: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly accessSigner;
  private readonly refreshSigner;
  private readonly refreshVerifier;

  constructor(private prisma: PrismaService) {
    this.accessSigner = createSigner({
      key: process.env.JWT_SECRET || "your-secret-key",
      expiresIn: "1d",
    });

    this.refreshSigner = createSigner({
      key: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
      expiresIn: "7d",
    });

    this.refreshVerifier = createVerifier({
      key: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
    });
  }

  async signUp(email: string, password: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    await this.prisma.user.create({
      data: {
        email,
        password: await Bun.password.hash(password),
      },
    });
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
      tokens: tokens,
    };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    const { sub: id, email } = this.refreshVerifier(token);
    if (!id || !email) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return this.generateTokens(id, email);
  }

  generateTokens(userId: number, email: string): AuthTokens {
    const accessToken = this.accessSigner({ sub: userId, email, type: "access" });
    const refreshToken = this.refreshSigner({ sub: userId, email, type: "refresh" });
    return { accessToken, refreshToken };
  }
}
