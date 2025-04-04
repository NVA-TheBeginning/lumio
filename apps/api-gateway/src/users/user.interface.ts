// src/users/user.interface.ts
export interface User {
  id: number;
  email: string;
  password_hash?: string; // optionnel, à ne pas exposer directement
  firstName: string;
  lastName: string;
  role: "STUDENT" | "TEACHER";
}
