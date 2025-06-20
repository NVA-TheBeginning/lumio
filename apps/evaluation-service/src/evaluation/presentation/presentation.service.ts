import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreatePresentationDto } from "./dto/create-presentation.dto";
import { UpdatePresentationDto } from "./dto/update-presentation.dto";

@Injectable()
export class PresentationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePresentationDto) {
    return this.prisma.presentation.create({ data: dto });
  }

  async findAll(projectId: number, promotionId: number) {
    return this.prisma.presentation.findMany({
      where: { projectId, promotionId },
      include: { orders: true },
    });
  }

  async findOne(id: number) {
    return await this.prisma.presentation.findUniqueOrThrow({
      where: { id },
      include: { orders: true },
    });
  }

  async update(id: number, dto: UpdatePresentationDto) {
    await this.findOne(id);
    return this.prisma.presentation.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.presentation.delete({ where: { id } });
  }
}
