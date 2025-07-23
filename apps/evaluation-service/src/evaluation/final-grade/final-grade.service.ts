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

    // We need to fetch group members from project-service
    // For now, we'll get unique group IDs and student IDs from grades
    const _groupIds = [...new Set(grades.filter((g) => g.groupId !== null).map((g) => g.groupId))];

    // Create a criteria map for quick lookup
    const _criteriaMap = new Map(criteria.map((c) => [c.id, c]));

    // Group grades by groupId and studentId
    const gradesByGroupAndStudent = grades.reduce(
      (acc, grade) => {
        if (grade.groupId !== null && grade.studentId !== null) {
          const key = `${grade.groupId}-${grade.studentId}`;
          if (!acc[key]) {
            acc[key] = {
              groupId: grade.groupId,
              studentId: grade.studentId,
              grades: [],
            };
          }
          acc[key].grades.push(grade);
        }
        return acc;
      },
      {} as Record<string, { groupId: number; studentId: number; grades: typeof grades }>,
    );

    // Calculate final grades for each student
    const finalGradePromises = Object.values(gradesByGroupAndStudent).map(
      async ({ groupId, studentId, grades: studentGrades }) => {
        // Calculate weighted average for this student
        let totalWeightedScore = 0;
        let totalWeight = 0;

        // For each criterion, find the student's grade
        for (const criterion of criteria) {
          const studentGrade = studentGrades.find((g) => g.gradingCriteriaId === criterion.id);

          if (studentGrade) {
            const weight = criterion.weight;
            totalWeightedScore += (studentGrade.gradeValue * weight) / 100;
            totalWeight += weight;
          }
        }

        // Only calculate if we have complete grades
        if (totalWeight > 0) {
          const finalGrade = totalWeightedScore;

          // Find existing final grade for this student
          const existing = await this.prisma.finalGrade.findFirst({
            where: { projectId, promotionId, groupId, studentId },
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
              studentId,
              finalGrade,
              comment: `Calculé automatiquement (${totalWeight}% des critères)`,
            },
          });
        }
        return null;
      },
    );

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
