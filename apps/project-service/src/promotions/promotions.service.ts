import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    const { studentIds, ...promotionData } = createPromotionDto;

    if (!(studentIds && Array.isArray(studentIds))) {
      throw new BadRequestException("studentIds must be provided and must be an array");
    }

    return this.prisma.$transaction(async (prisma) => {
      const promotion = await prisma.promotion.create({
        data: promotionData,
      });

      const studentPromotions = await Promise.all(
        studentIds.map(async (userId: number) => {
          return prisma.studentPromotion.create({
            data: {
              promotionId: promotion.id,
              userId,
            },
          });
        }),
      );

      return {
        ...promotion,
        studentPromotions,
        students: studentIds,
      };
    });
  }

  findAll(creatorId?: number) {
    if (creatorId) {
      return this.prisma.promotion.findMany({
        where: {
          creatorId,
        },
        include: {
          studentPromotions: {
            select: {
              userId: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    return this.prisma.promotion.findMany({
      include: {
        studentPromotions: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        studentPromotions: {
          select: {
            userId: true,
          },
        },
      },
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
        userId: {
          in: studentIds,
        },
      },
    });
  }
}
