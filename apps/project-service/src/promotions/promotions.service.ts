import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

interface StudentData {
  name: string;
  firstname: string;
  email: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseStudentsCsv(csv: string): StudentData[] {
    if (!csv || !csv.trim()) {
      return [];
    }

    const lines = csv
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const students: StudentData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const parts = line.split(",").map((part) => part.trim());

      if (parts.length < 3) {
        throw new BadRequestException(`Invalid CSV format at line ${i + 1}. Not enough columns.`);
      }

      const [name, firstname, email] = parts;

      students.push({ name, firstname, email });
    }

    return students;
  }

  async create(createPromotionDto: CreatePromotionDto) {
    const studentsData = this.parseStudentsCsv(createPromotionDto.students_csv);

    const { students_csv, ...promotionData } = createPromotionDto;

    return this.prisma.$transaction(async (prisma) => {
      const promotion = await prisma.promotion.create({
        data: promotionData,
      });

      let id = 0;
      const studentPromotions = await Promise.all(
        studentsData.map(async () => {
          const studentId = id;
          id++;

          return prisma.studentPromotion.create({
            data: {
              promotionId: promotion.id,
              studentId: studentId,
            },
          });
        }),
      );

      return {
        ...promotion,
        studentPromotions,
        studentsData,
      };
    });
  }

  findAll(creatorId?: number) {
    if (creatorId) {
      return this.prisma.promotion.findMany({
        where: {
          creatorId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    return this.prisma.promotion.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Promotion with id ${id} not found`);
    }
    return item;
  }

  async update(id: number, updatePromotionDto: UpdatePromotionDto) {
    await this.findOne(id);
    return this.prisma.promotion.update({
      where: { id },
      data: updatePromotionDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.promotion.delete({
      where: { id },
    });
  }

  async removeStudents(promotionId: number, studentIds: number[]) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with id ${promotionId} not found`);
    }

    return this.prisma.studentPromotion.deleteMany({
      where: {
        promotionId,
        studentId: {
          in: studentIds,
        },
      },
    });
  }
}
