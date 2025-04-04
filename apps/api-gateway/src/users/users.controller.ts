// src/users/users.controller.ts
import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { User } from "@/users/user.interface.js";
import { UsersService } from "@/users/users.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint pour récupérer les informations d'un utilisateur par son ID.
   */
  @Get(":id")
  async getUserById(@Param("id") id: string): Promise<User> {
    const user = await this.usersService.findById(Number(id));
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
    }
    return user;
  }
}
