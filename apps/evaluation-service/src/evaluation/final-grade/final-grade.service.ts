// import { Injectable } from "@nestjs/common";
// import { PrismaService } from "@/prisma.service";
// import { UpdateFinalGradeDto } from "./dto/update-final-grade.dto";

// @Injectable()
// export class FinalGradeService {
//   constructor(private readonly prisma: PrismaService) {}

//   async findAll() {
//     return this.prisma.finalGrade.findMany();
//   }

//   async updateAll(projectPromotionId: number, dtos: UpdateFinalGradeDto[]) {
//     const promises = dtos.map((dto) =>²
//       this.prisma.finalGrade.upsert({
//         where: { projectPromotionId_userId: { projectPromotionId, userId: dto.userId } },
//         create: {
//           projectPromotionId,
//           userId: dto.userId,
//           finalGrade: dto.finalGrade,
//           comment: dto.comment,
//         },
//         update: {
//           finalGrade: dto.finalGrade,
//           comment: dto.comment,
//         },
//       }),
//     );
//     return Promise.all(promises);
//   }
// }
