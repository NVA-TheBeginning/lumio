import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createSigner, createVerifier, VerifierCallback } from "fast-jwt";
import { PrismaService } from "@/prisma.service.js";

interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResult {
  id: number;
  email: string;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly signer;
  private readonly verifier;

  constructor(private prisma: PrismaService) {
    this.signer = createSigner({
      key: process.env.JWT_SECRET || "your-secret-key",
      expiresIn: 86400, // 1 day
    });

    this.verifier = createVerifier({
      key: process.env.JWT_SECRET || "your-secret-key",
    });
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
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

    const payload: JwtPayload = {
      sub: newUser.id,
      email: newUser.email,
    };

    const token = this.signer(payload);
    return { id: newUser.id, email: newUser.email, token };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await Bun.password.verify(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const token = this.signer(payload);

    return { ...user, token };
  }

  async validateToken(token: string): Promise<VerifierCallback> {
    try {
      const payload = this.verifier(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
