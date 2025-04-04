// src/users/users.service.ts
import { Injectable } from "@nestjs/common";
import { User } from "@/users/user.interface.js";

@Injectable()
export class UsersService {
  // Exemple statique de données utilisateurs.
  // Dans un vrai scénario, ce service pourrait appeler le microservice Auth ou accéder à une base de données.
  private readonly users: User[] = [
    {
      id: 1,
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "STUDENT",
    },
    {
      id: 2,
      email: "jane.doe@example.com",
      firstName: "Jane",
      lastName: "Doe",
      role: "TEACHER",
    },
  ];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }
}
