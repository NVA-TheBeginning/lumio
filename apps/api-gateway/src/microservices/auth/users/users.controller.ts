import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface CreateStudentDto extends Record<string, unknown> {
  lastname: string;
  firstname: string;
  email: string;
}

interface UpdateStudentDto extends Record<string, unknown> {
  lastname?: string;
  firstname?: string;
  email?: string;
}
interface UpdatePasswordDto extends Record<string, unknown> {
  newPassword: string;
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("/students")
  @HttpCode(HttpStatus.CREATED)
  async createStudents(@Body() createStudentDtos: CreateStudentDto[]): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/users/students", "POST", { students: createStudentDtos });
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find a user by ID" })
  @ApiOkResponse({ description: "User found successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async findUser(@Param("id", ParseIntPipe) id: number): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}`, "GET");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a user by ID" })
  @ApiOkResponse({ description: "User updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async updateUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}`, "PATCH", { updateStudentDto });
  }

  @Patch(":id/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a user's password" })
  @ApiOkResponse({ description: "Password updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async updatePassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}/password`, "PATCH", updatePasswordDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a user by ID" })
  @ApiOkResponse({ description: "User deleted successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async deleteUser(@Param("id", ParseIntPipe) id: number): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}`, "DELETE");
  }
}
