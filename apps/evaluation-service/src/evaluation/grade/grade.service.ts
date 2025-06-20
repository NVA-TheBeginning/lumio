import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(criteriaId: number, dto: CreateGradeDto) {
    return this.prisma.grade.create({ data: { gradingCriteriaId: criteriaId, ...dto } });
  }

  async findAll(criteriaId: number) {
    return this.prisma.grade.findMany({ where: { gradingCriteriaId: criteriaId } });
  }

  async findOne(id: number) {
    return this.prisma.grade.findUniqueOrThrow({ where: { id } });
  }

  async update(id: number, dto: UpdateGradeDto) {
    await this.findOne(id);
    return this.prisma.grade.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.grade.delete({ where: { id } });
  }
}
