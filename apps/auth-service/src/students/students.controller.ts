import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreateStudentDto, UpdatePasswordDto, UpdateStudentDto } from "./dto/students.dto";
import { StudentsService } from "./students.service";

@ApiTags("students")
@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: "Create multiple students" })
  @ApiCreatedResponse({ description: "Students created successfully" })
  @ApiBody({ type: [CreateStudentDto], description: "Array of students to create" })
  async createStudents(@Body() createStudentDtos: CreateStudentDto[]) {
    return this.studentsService.createStudents(createStudentDtos);
  }

  @Get(":id")
  @ApiOperation({ summary: "Find a student by ID" })
  @ApiOkResponse({ description: "Student found successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the student" })
  async findStudent(@Param("id", ParseIntPipe) id: number) {
    return await this.studentsService.findStudentById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a student by ID" })
  @ApiOkResponse({ description: "Student updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the student" })
  @ApiBody({ type: UpdateStudentDto, description: "Fields to update" })
  async updateStudent(@Param("id", ParseIntPipe) id: number, @Body() updateStudentDto: UpdateStudentDto) {
    return await this.studentsService.updateStudent(id, updateStudentDto);
  }

  @Patch(":id/password")
  @ApiOperation({ summary: "Update a student's password" })
  @ApiOkResponse({ description: "Password updated successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the student" })
  @ApiBody({ type: UpdatePasswordDto, description: "New password" })
  async updatePassword(@Param("id", ParseIntPipe) id: number, @Body() updatePasswordDto: UpdatePasswordDto) {
    return await this.studentsService.updatePassword(id, updatePasswordDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a student by ID" })
  @ApiOkResponse({ description: "Student deleted successfully" })
  @ApiParam({ name: "id", type: Number, description: "ID of the student" })
  async deleteStudent(@Param("id", ParseIntPipe) id: number) {
    return await this.studentsService.deleteStudent(id);
  }
}
