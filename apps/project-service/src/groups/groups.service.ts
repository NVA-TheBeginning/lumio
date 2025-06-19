import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service.js";
import { CreateGroupDto, GroupSettingsDto, UpdateGroupDto } from "./dto/group.dto";

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: number, promotionId: number, dto: CreateGroupDto) {
    const pp = await this.prisma.projectPromotion.findUnique({
      where: { projectId_promotionId: { projectId, promotionId } },
    });
    if (!pp) throw new NotFoundException("Project–Promotion introuvable");

    const records = Array(dto.numberOfGroups)
      .fill(undefined)
      .map((_, i) => ({
        projectId,
        promotionId,
        name: dto.baseName ? `${dto.baseName} ${i + 1}` : "",
      }));

    return this.prisma.group.createMany({ data: records });
  }

  async findAll(projectId: number, promotionId: number) {
    return this.prisma.group.findMany({
      where: { projectId, promotionId },
      include: { members: true },
    });
  }

  async update(id: number, dto: UpdateGroupDto) {
    return this.prisma.group.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: number) {
    return this.prisma.group.delete({ where: { id } });
  }

  async addMembers(groupId: number, studentIds: number[]) {
    const data = studentIds.map((studentId) => ({ groupId, studentId }));
    return this.prisma.groupMember.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async removeMember(groupId: number, studentId: number) {
    return this.prisma.groupMember.delete({
      where: { groupId_studentId: { groupId, studentId } },
    });
  }

  async getSettings(projectId: number, promotionId: number) {
    return this.prisma.groupSettings.findUnique({
      where: { projectId_promotionId: { projectId, promotionId } },
    });
  }

  async updateSettings(projectId: number, promotionId: number, dto: GroupSettingsDto) {
    return this.prisma.groupSettings.update({
      where: { projectId_promotionId: { projectId, promotionId } },
      data: {
        minMembers: dto.minMembers,
        maxMembers: dto.maxMembers,
        mode: dto.mode,
        deadline: new Date(dto.deadline),
      },
    });
  }

  async randomizeGroups(projectId: number, promotionId: number) {
    const projectPromotion = await this.prisma.projectPromotion.findUnique({
      where: { projectId_promotionId: { projectId, promotionId } },
      include: {
        groupSettings: true,
        groups: {
          select: { id: true },
        },
      },
    });

    if (!projectPromotion?.groupSettings) {
      throw new NotFoundException("Project–Promotion introuvable");
    }

    const { groupSettings, groups: existingGroups } = projectPromotion;
    const { maxMembers } = groupSettings;

    if (!maxMembers) {
      throw new BadRequestException("Le paramètre 'maxMembers' n'est pas défini pour les réglages de groupe.");
    }

    const studentsInPromotion = await this.prisma.studentPromotion.findMany({
      where: { promotionId },
      select: { userId: true },
    });

    if (studentsInPromotion.length === 0) {
      throw new BadRequestException("Aucun étudiant trouvé dans cette promotion");
    }

    const allStudentIds = studentsInPromotion.map((sp) => sp.userId);
    const shuffledStudents = this.shuffleArray([...allStudentIds]);

    const totalStudents = shuffledStudents.length;
    const idealNumberOfGroups = Math.ceil(totalStudents / maxMembers);

    return await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.deleteMany({
        where: {
          group: {
            promotionId: promotionId,
            projectId: projectId,
          },
        },
      });

      let finalGroupIds: number[] = existingGroups.map((g) => g.id);

      if (existingGroups.length > idealNumberOfGroups) {
        const groupsToDelete = existingGroups.slice(idealNumberOfGroups);
        await tx.group.deleteMany({
          where: {
            id: {
              in: groupsToDelete.map((g) => g.id),
            },
          },
        });
        finalGroupIds = existingGroups.slice(0, idealNumberOfGroups).map((g) => g.id);
      }

      if (finalGroupIds.length === 0 && totalStudents > 0) {
        throw new BadRequestException("Impossible de créer ou d'utiliser des groupes pour les étudiants.");
      }

      const assignments: Array<{ groupId: number; studentId: number }> = [];
      let studentIdx = 0;

      for (let i = 0; i < finalGroupIds.length; i++) {
        const groupId = finalGroupIds[i];
        const studentsRemaining = totalStudents - studentIdx;
        const groupsRemaining = finalGroupIds.length - i;

        let numStudentsForThisGroup = Math.min(maxMembers, Math.ceil(studentsRemaining / groupsRemaining));

        if (i === finalGroupIds.length - 1) {
          numStudentsForThisGroup = studentsRemaining;
        }

        for (let j = 0; j < numStudentsForThisGroup && studentIdx < totalStudents; j++) {
          assignments.push({
            groupId: groupId,
            studentId: shuffledStudents[studentIdx],
          });
          studentIdx++;
        }
      }

      if (assignments.length > 0) {
        await tx.groupMember.createMany({
          data: assignments,
          skipDuplicates: true,
        });
      }
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
