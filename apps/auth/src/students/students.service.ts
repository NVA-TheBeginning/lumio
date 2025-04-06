import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateStudentDto, UpdatePasswordDto, UpdateStudentDto } from "./dto/students.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateRandomPassword(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
  }

  async createStudents(students: CreateStudentDto[]) {
    const studentsWithPasswords = await Promise.all(
      students.map(async (student) => {
        const randomPassword = this.generateRandomPassword(8);
        const hashedPassword = await Bun.password.hash(randomPassword);

        return {
          student,
          randomPassword,
          hashedPassword,
        };
      }),
    );

    const studentsData = studentsWithPasswords.map((item) => ({
      lastname: item.student.lastname,
      firstname: item.student.firstname,
      email: item.student.email,
      password: item.hashedPassword,
      role: "STUDENT" as const,
    }));

    const result = await this.prisma.user.createMany({
      data: studentsData,
      skipDuplicates: true,
    });

    // TODO: Send emails to students with their passwords
    return {
      count: result.count,
      students: studentsWithPasswords.map((item) => ({
        email: item.student.email,
        initialPassword: item.randomPassword,
      })),
    };
  }

  async findStudentById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
    });
  }

  async updateStudent(id: number, updateStudentDto: UpdateStudentDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateStudentDto,
    });
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const hashedPassword = await Bun.password.hash(updatePasswordDto.newPassword);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async deleteStudent(id: number) {
    const student = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
