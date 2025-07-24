import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { UpdateFinalGradeDto } from "./dto/update-final-grade.dto";

@Injectable()
export class FinalGradeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rounds a grade up to the next 0.5 increment
   * Examples: 19.4 → 19.5, 19.9 → 20.0, 18.1 → 18.5, 18.6 → 19.0
   */
  private roundGradeToNextHalf(grade: number): number {
    return Math.ceil(grade * 2) / 2;
  }

  async findAll(projectId: number, promotionId: number) {
    return this.prisma.finalGrade.findMany({
      where: {
        projectId,
        promotionId,
      },
      orderBy: { groupId: "asc" },
    });
  }

  async findByStudentAndProject(studentId: number, projectId: number) {
    const [finalGrades, criteriaWithGrades] = await this.prisma.$transaction([
      this.prisma.finalGrade.findMany({
        where: {
          studentId,
          projectId,
        },
        orderBy: { promotionId: "asc" },
      }),
      this.prisma.gradingCriteria.findMany({
        where: { projectId },
        include: {
          grades: {
            where: {
              OR: [{ studentId }, { groupId: { not: null } }],
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const criteriaWithStudentGrades = criteriaWithGrades.map((criterion) => ({
      ...criterion,
      studentGrade: criterion.grades.find(
        (grade) => grade.studentId === studentId || (grade.groupId !== null && !criterion.individual),
      ),
    }));

    return {
      finalGrades,
      criteriaWithGrades: criteriaWithStudentGrades,
    };
  }

  async calculateAndSave(projectId: number, promotionId: number) {
    const criteria = await this.prisma.gradingCriteria.findMany({
      where: { projectId, promotionId },
    });

    if (criteria.length === 0) {
      throw new NotFoundException("No criteria found for this project/promotion");
    }

    const grades = await this.prisma.grade.findMany({
      where: {
        gradingCriteriaId: { in: criteria.map((c) => c.id) },
      },
    });

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

    const finalGradePromises = Object.values(gradesByGroupAndStudent).map(
      async ({ groupId, studentId, grades: studentGrades }) => {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        for (const criterion of criteria) {
          const studentGrade = studentGrades.find((g) => g.gradingCriteriaId === criterion.id);

          if (studentGrade) {
            totalWeightedScore += studentGrade.gradeValue;
            totalWeight += criterion.weight;
          }
        }

        if (totalWeight > 0) {
          const rawFinalGrade = totalWeightedScore;
          const finalGrade = this.roundGradeToNextHalf(rawFinalGrade);

          const existing = await this.prisma.finalGrade.findFirst({
            where: { projectId, promotionId, groupId, studentId },
          });

          if (existing) {
            return await this.prisma.finalGrade.update({
              where: { id: existing.id },
              data: {
                finalGrade,
                comment: `Calculé automatiquement - somme des notes pondérées arrondie au 0.5 supérieur (${totalWeight}% des critères)`,
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
              comment: `Calculé automatiquement - somme des notes pondérées arrondie au 0.5 supérieur (${totalWeight}% des critères)`,
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
