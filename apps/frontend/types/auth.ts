import { Role } from "@/lib/types";

export interface LoginResponse {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
  AuthTokens: {
    accessToken: string;
    refreshToken: string;
  };
}
