import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags
} from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import {IsEmail, IsOptional, IsString} from "class-validator";

export class CreateStudentDto {
  @IsString()
  @ApiProperty({ description: 'User first name', type: String, example: 'John' })
  firstname!: string;

  @IsString()
  @ApiProperty({ description: 'User last name', type: String, example: 'Doe' })
  lastname!: string;

  @IsEmail()
  @ApiProperty({ description: 'User email', type: String, example: 'johndoe@gmail.com'})
  email!: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User first name', type: String, required: false, example: 'John'  })
  firstname?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User last name', type: String, required: false, example: 'Doe'  })
  lastname?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ description: 'User email', type: String, required: false, example: 'johndoe@gmail.com' })
  email?: string;
}

export class UpdatePasswordDto {
  @IsString()
  @ApiProperty({ description: 'New password', type: String, example: 'newpassword123' })
  newPassword!: string;
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("/students")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create multiple student users" })
  @ApiBody({ type: [CreateStudentDto] })
  @ApiCreatedResponse({ description: "Students created successfully" })
  async createStudents(@Body() createStudentDtos: CreateStudentDto[]): Promise<unknown> {
    return this.proxy.forwardRequest("auth", "/users/students", "POST", { students: createStudentDtos });
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find a user by ID" })
  @ApiOkResponse({ description: "User found successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  @ApiOkResponse({ description: "User found successfully", schema: { example: { id: 1, firstname: 'John', lastname: 'Doe', email: 'john@example.com' } } })
  async findUser(@Param("id", ParseIntPipe) id: number): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}`, "GET");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateStudentDto })
  @ApiOperation({ summary: "Update a user by ID" })
  @ApiOkResponse({ description: "User updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async updateUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<unknown> {
    return this.proxy.forwardRequest("auth", `/users/${id}`, "PATCH", updateStudentDto);
  }

  @Patch(":id/password")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdatePasswordDto })
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
