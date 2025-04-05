// src/jwt/guards/jwt-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Ce guard utilise la stratégie "jwt" définie dans le module Auth.
 * Il protège les routes en vérifiant la présence et la validité d'un JWT.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
