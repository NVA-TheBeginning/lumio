import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProjectStatus } from "@prisma-project/client";
import { PrismaService } from "@/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const { name, description, creatorId, promotionIds, groupSettings } = createProjectDto;

    const promotions = await this.prisma.promotion.findMany({
      where: { id: { in: promotionIds } },
    });

    if (promotions.length !== promotionIds.length) {
      throw new BadRequestException("One or more promotions do not exist");
    }

    const gsIds = groupSettings.map((gs) => gs.promotionId);
    const invalid = gsIds.filter((id) => !promotionIds.includes(id));
    if (invalid.length) {
      throw new BadRequestException(`Group settings contain invalid promotion ids: ${invalid.join(", ")}`);
    }

    for (const gs of groupSettings) {
      if (gs.minMembers > gs.maxMembers) {
        throw new BadRequestException("minMembers cannot be greater than maxMembers");
      }
      if (new Date(gs.deadline) < new Date()) {
        throw new BadRequestException("Deadline must be in the future");
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: { name, description, creatorId },
      });

      await prisma.projectPromotion.createMany({
        data: promotionIds.map((promotionId) => ({
          projectId: project.id,
          promotionId,
          status: ProjectStatus.DRAFT,
        })),
      });

      await prisma.groupSettings.createMany({
        data: groupSettings.map((gs) => ({
          projectId: project.id,
          promotionId: gs.promotionId,
          minMembers: gs.minMembers,
          maxMembers: gs.maxMembers,
          mode: gs.mode,
          deadline: new Date(gs.deadline),
        })),
      });

      return project;
    });
  }

  async findByCreator(creatorId: number) {
    return this.prisma.project.findMany({ where: { creatorId, deletedAt: null } });
  }

  async findAll() {
    return this.prisma.project.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id, deletedAt: null },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async findByPromotions(promotionIds: number[]) {
    const links = await this.prisma.projectPromotion.findMany({
      where: { promotionId: { in: promotionIds } },
      include: { project: true },
    });

    const result: Record<number, unknown[]> = {};
    for (const pid of promotionIds) {
      result[pid] = [];
    }
    for (const link of links) {
      if (!result[link.promotionId]) {
        result[link.promotionId] = [];
      }
      result[link.promotionId].push(link.project);
    }
    return result;
  }

  async update(id: number, updateDto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const data: Prisma.ProjectUpdateInput = {};
    if (updateDto.name) data.name = updateDto.name;
    if (updateDto.description) data.description = updateDto.description;
    if (updateDto.creatorId) data.creatorId = updateDto.creatorId;

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.project.update({ where: { id }, data });

      if (updateDto.promotionIds) {
        const promos = await prisma.promotion.findMany({
          where: { id: { in: updateDto.promotionIds } },
        });
        if (promos.length !== updateDto.promotionIds.length) {
          throw new BadRequestException("One or more promotions do not exist");
        }
        await prisma.projectPromotion.deleteMany({ where: { projectId: id } });
        await prisma.projectPromotion.createMany({
          data: updateDto.promotionIds.map((promotionId) => ({
            projectId: id,
            promotionId,
            status: ProjectStatus.DRAFT,
          })),
        });
      }

      if (updateDto.groupSettings) {
        for (const gs of updateDto.groupSettings) {
          if (gs.minMembers > gs.maxMembers) {
            throw new BadRequestException("minMembers cannot be greater than maxMembers");
          }
          if (new Date(gs.deadline) < new Date()) {
            throw new BadRequestException("Deadline must be in the future");
          }
        }
        await prisma.groupSettings.deleteMany({ where: { projectId: id } });
        await prisma.groupSettings.createMany({
          data: updateDto.groupSettings.map((gs) => ({
            projectId: id,
            promotionId: gs.promotionId,
            minMembers: gs.minMembers,
            maxMembers: gs.maxMembers,
            mode: gs.mode,
            deadline: new Date(gs.deadline),
          })),
        });
      }

      return updated;
    });
  }

  async updateStatus(idProject: number, idPromotion: number, status: ProjectStatus): Promise<void> {
    const existing = await this.prisma.projectPromotion.findUnique({
      where: { projectId_promotionId: { projectId: idProject, promotionId: idPromotion } },
    });

    if (!existing) throw new NotFoundException(`Project ${idProject} not found for promotion ${idPromotion}`);

    await this.prisma.projectPromotion.update({
      where: { projectId_promotionId: { projectId: idProject, promotionId: idPromotion } },
      data: { status },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.project.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    await this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }
}
