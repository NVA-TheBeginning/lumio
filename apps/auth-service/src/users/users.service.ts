import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateStudentDto, UpdatePasswordDto, UpdateStudentDto } from "./dto/students.dto";

export class UserResponse {
  id!: number;
  email!: string;
  firstname?: string | null;
  lastname?: string | null;
  role!: string;
}

@Injectable()
export class UsersService {
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

    return this.prisma.$transaction(async (tx) => {
      const insertResult = await tx.user.createMany({
        data: studentsData,
        skipDuplicates: true,
      });

      const createdStudents = await tx.user.findMany({
        where: {
          email: {
            in: studentsData.map((s) => s.email),
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      const students = studentsWithPasswords
        .map((user) => {
          const createdStudent = createdStudents.find((s) => s.email === user.student.email);
          if (!createdStudent) return null;

          return {
            studentId: createdStudent.id,
            email: user.student.email,
            initialPassword: user.randomPassword,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      return {
        count: insertResult.count,
        students,
      };
    });
  }

  async findUserById(id: number) {
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

  async updateUser(id: number, updateStudentDto: UpdateStudentDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        lastname: updateStudentDto.lastname,
        firstname: updateStudentDto.firstname,
        email: updateStudentDto.email,
      },
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

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findUsersByIds(ids: number[]): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
    });
  }
}
