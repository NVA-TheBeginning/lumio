import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { UpdateFinalGradeDto } from "./dto/update-final-grade.dto";

@Injectable()
export class FinalGradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: number, promotionId: number) {
    return this.prisma.finalGrade.findMany({
      where: {
        projectId,
        promotionId,
      },
      orderBy: { groupId: "asc" },
    });
  }

  async calculateAndSave(projectId: number, promotionId: number) {
    // Get all criteria for this project/promotion
    const criteria = await this.prisma.gradingCriteria.findMany({
      where: { projectId, promotionId },
    });

    if (criteria.length === 0) {
      throw new NotFoundException("No criteria found for this project/promotion");
    }

    // Get all grades for these criteria
    const grades = await this.prisma.grade.findMany({
      where: {
        gradingCriteriaId: { in: criteria.map((c) => c.id) },
      },
    });

    // Create a criteria map for quick lookup
    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

    // Group grades by groupId
    const gradesByGroup = grades.reduce(
      (acc, grade) => {
        if (grade.groupId !== null) {
          if (!acc[grade.groupId]) {
            acc[grade.groupId] = [];
          }
          acc[grade.groupId].push(grade);
        }
        return acc;
      },
      {} as Record<number, typeof grades>,
    );

    // Calculate final grades for each group
    const finalGradePromises = Object.entries(gradesByGroup).map(async ([groupIdStr, groupGrades]) => {
      const groupId = parseInt(groupIdStr);

      // Calculate weighted average
      let totalWeightedScore = 0;
      let totalWeight = 0;

      for (const grade of groupGrades) {
        const criteria = criteriaMap.get(grade.gradingCriteriaId);
        if (criteria) {
          const weight = criteria.weight;
          totalWeightedScore += (grade.gradeValue * weight) / 100;
          totalWeight += weight;
        }
      }

      // Only calculate if we have complete grades
      if (totalWeight > 0) {
        const finalGrade = totalWeightedScore;

        // Find or create final grade
        const existing = await this.prisma.finalGrade.findFirst({
          where: { projectId, promotionId, groupId },
        });

        if (existing) {
          return await this.prisma.finalGrade.update({
            where: { id: existing.id },
            data: {
              finalGrade,
              comment: `Calculé automatiquement (${totalWeight}% des critères)`,
              validatedAt: new Date(),
            },
          });
        }
        return await this.prisma.finalGrade.create({
          data: {
            projectId,
            promotionId,
            groupId,
            finalGrade,
            comment: `Calculé automatiquement (${totalWeight}% des critères)`,
          },
        });
      }
      return null;
    });

    const results = await Promise.all(finalGradePromises);
    const finalGrades = results.filter((result) => result !== null);

    return finalGrades;
  }

  async update(id: number, dto: UpdateFinalGradeDto) {
    return this.prisma.finalGrade.update({
      where: { id },
      data: {
        finalGrade: dto.finalGrade,
        comment: dto.comment,
        validatedAt: new Date(),
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.finalGrade.findUniqueOrThrow({
      where: { id },
    });
  }
}
