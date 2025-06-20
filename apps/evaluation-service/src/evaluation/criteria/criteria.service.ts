// import { Injectable, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "@/prisma.service";
// import { CreateCriteriaDto } from "./dto/create-criteria.dto";
// import { UpdateCriteriaDto } from "./dto/update-criteria.dto";

// @Injectable()
// export class CriteriaService {
//   constructor(private readonly prisma: PrismaService) {}

//   async create(projectPromotionId: number, dto: CreateCriteriaDto) {
//     return this.prisma.gradingCriteria.create({ data: { projectPromotionId, ...dto } });
//   }

//   async findAll(projectPromotionId: number) {
//     return this.prisma.gradingCriteria.findMany({ where: { projectPromotionId } });
//   }

//   async findOne(id: number) {
//     const crit = await this.prisma.gradingCriteria.findUnique({ where: { id } });
//     if (!crit) throw new NotFoundException(`Critère #${id} introuvable`);
//     return crit;
//   }

//   async update(id: number, dto: UpdateCriteriaDto) {
//     await this.findOne(id);
//     return this.prisma.gradingCriteria.update({ where: { id }, data: dto });
//   }

//   async remove(id: number) {
//     await this.findOne(id);
//     return this.prisma.gradingCriteria.delete({ where: { id } });
//   }
// }
