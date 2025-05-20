import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateStudentDto, UpdatePasswordDto, UpdateStudentDto } from "./dto/students.dto";

export interface UserResponse {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  role: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  size: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_ROWS_PER_PAGE = 10;

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

    const studentsData = studentsWithPasswords?.map((item) => ({
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
            password: user.randomPassword,
          };
        })
        .filter((student) => student !== null);

      const urlNotif = process.env.NOTIF_SERVICE_URL || "http://localhost:3007";
      await fetch(`${urlNotif}/email/create-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: students }),
      });

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
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (_) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findUsersByIds(
    ids: number[],
    page: string | undefined,
    size: string = String(DEFAULT_ROWS_PER_PAGE),
  ): Promise<PaginatedResponse<UserResponse>> {
    const currentPage = page ? parseInt(page, 10) || 1 : 1;
    const itemsPerPage = parseInt(size, 10) || DEFAULT_ROWS_PER_PAGE;
    const skipAmount = (currentPage - 1) * itemsPerPage;

    const users = await this.prisma.user.findMany({
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
        createdAt: true,
      },
      skip: skipAmount,
      take: itemsPerPage,
    });

    const totalRows = await this.prisma.user.count({
      where: {
        id: {
          in: ids,
        },
      },
    });

    const totalPages = Math.ceil(totalRows / itemsPerPage);

    return {
      data: users,
      size: totalRows,
      page: currentPage,
      pageSize: itemsPerPage,
      totalPages: totalPages,
    };
  }
}
