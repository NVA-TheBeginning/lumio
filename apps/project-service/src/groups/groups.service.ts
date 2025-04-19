// src/groups/groups.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
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
}
