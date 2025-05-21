import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateStudentDto, UpdatePasswordDto, UpdateStudentDto } from "./dto/students.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("/students")
  @ApiOperation({ summary: "Create multiple students" })
  @ApiCreatedResponse({ description: "Students created successfully" })
  @ApiBody({ type: [CreateStudentDto], description: "Array of students to create" })
  async createStudents(@Body() students: CreateStudentDto[]) {
    return this.usersService.createStudents(students);
  }

  @Get(":id")
  @ApiOperation({ summary: "Find a user by ID" })
  @ApiOkResponse({ description: "User found successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async findUser(@Param("id", ParseIntPipe) id: number) {
    return await this.usersService.findUserById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user by ID" })
  @ApiOkResponse({ description: "User updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  @ApiBody({ type: UpdateStudentDto, description: "Fields to update" })
  async updateUser(@Param("id", ParseIntPipe) id: number, @Body() updateStudentDto: UpdateStudentDto) {
    return await this.usersService.updateUser(id, updateStudentDto);
  }

  @Patch(":id/password")
  @ApiOperation({ summary: "Update a user's password" })
  @ApiOkResponse({ description: "Password updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  @ApiBody({ type: UpdatePasswordDto, description: "New password" })
  async updatePassword(@Param("id", ParseIntPipe) id: number, @Body() updatePasswordDto: UpdatePasswordDto) {
    return await this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user by ID" })
  @ApiOkResponse({ description: "User deleted successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the user" })
  async deleteUser(@Param("id", ParseIntPipe) id: number) {
    return await this.usersService.deleteUser(id);
  }

  @Get()
  @ApiOperation({ summary: "Find multiple users by their IDs" })
  @ApiOkResponse({ description: "Users found successfully" })
  @ApiQuery({ name: "ids", type: [Number], description: "Array of user IDs to find", required: true })
  async findUsers(@Query("ids") ids: string, @Query("page") page?: string, @Query("size") size?: string) {
    if (!ids) {
      return [];
    }

    const userIds = ids.split(",").map((id) => Number.parseInt(id, 10));
    return await this.usersService.findUsersByIds(userIds, page, size);
  }
}
