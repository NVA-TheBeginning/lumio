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

      if (process.env.NODE_ENV !== "test") {
        const urlNotif = process.env.NOTIF_SERVICE_URL || "http://localhost:3007";
        await fetch(`${urlNotif}/email/create-students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: students }),
        });
      }

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
    page?: string,
    size?: string,
    all?: boolean,
  ): Promise<PaginatedResponse<UserResponse>> {
    if (!ids.length) {
      return {
        data: [],
        size: 0,
        page: 1,
        pageSize: 0,
        totalPages: 0,
      };
    }

    try {
      if (all) {
        return await this.findAllUsers(ids);
      }

      return await this.findUsersWithPagination(ids, page, size);
    } catch (error) {
      console.error("Failed to fetch users by IDs:", error);
      throw new Error("Unable to retrieve users");
    }
  }

  private async findAllUsers(ids: number[]): Promise<PaginatedResponse<UserResponse>> {
    const users = await this.executeUserQuery({ ids });

    return {
      data: users,
      size: users.length,
      page: 1,
      pageSize: users.length,
      totalPages: 1,
    };
  }

  private async findUsersWithPagination(
    ids: number[],
    page?: string,
    size?: string,
  ): Promise<PaginatedResponse<UserResponse>> {
    const paginationConfig = this.calculatePaginationConfig(page, size);

    const [users, totalRows] = await Promise.all([
      this.executeUserQuery({ ids, ...paginationConfig.queryOptions }),
      this.prisma.user.count({
        where: {
          id: {
            in: ids,
          },
        },
      }),
    ]);

    return {
      data: users,
      size: totalRows,
      page: paginationConfig.currentPage,
      pageSize: paginationConfig.effectivePageSize,
      totalPages:
        paginationConfig.effectivePageSize > 0 ? Math.ceil(totalRows / paginationConfig.effectivePageSize) : 1,
    };
  }

  private calculatePaginationConfig(page?: string, size?: string) {
    const currentPage = page ? Math.max(1, Number.parseInt(page, 10) || 1) : 1;
    const requestedPageSize = size ? Number.parseInt(size, 10) : null;

    const isPaginationEnabled = requestedPageSize !== null && requestedPageSize > 0;
    const itemsPerPage = isPaginationEnabled ? requestedPageSize : page ? DEFAULT_ROWS_PER_PAGE : null;

    const skipAmount = itemsPerPage && itemsPerPage > 0 ? (currentPage - 1) * itemsPerPage : 0;

    const queryOptions: { skip?: number; take?: number } = {};

    if (isPaginationEnabled || (page && !size)) {
      if (skipAmount > 0) {
        queryOptions.skip = skipAmount;
      }
      if (itemsPerPage && itemsPerPage > 0) {
        queryOptions.take = itemsPerPage;
      }
    }

    const effectivePageSize = itemsPerPage && itemsPerPage > 0 ? itemsPerPage : 0;

    return {
      currentPage,
      effectivePageSize,
      queryOptions,
    };
  }

  private async executeUserQuery(options: { ids: number[]; skip?: number; take?: number }): Promise<UserResponse[]> {
    const queryOptions = {
      where: {
        id: {
          in: options.ids,
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
      ...(options.skip !== undefined && { skip: options.skip }),
      ...(options.take !== undefined && { take: options.take }),
    };

    return await this.prisma.user.findMany(queryOptions);
  }
}
