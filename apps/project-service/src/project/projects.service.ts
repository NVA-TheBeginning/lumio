import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProjectStatus } from "@prisma-project/client";
import { Paginated, PaginationMeta } from "@/interfaces/pagination.interface";
import { PrismaService } from "@/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

export type GroupStatus = "no_groups" | "not_in_group" | "in_group";

export interface Project {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: number;
  name?: string;
  members: Array<{ studentId: number }>;
}

export interface ProjectWithGroupStatus {
  project: Project;
  groupStatus: GroupStatus;
  group?: Group;
}
export interface ProjectWithPromotions {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  promotions: Array<{
    id: number;
    name: string;
    status: ProjectStatus;
  }>;
}

export type ProjectsByPromotion = Record<number, Paginated<ProjectWithGroupStatus>>;

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

  async findByCreator(creatorId: number): Promise<ProjectWithPromotions[]> {
    if (creatorId == null) {
      throw new BadRequestException("creatorId is required");
    }

    const projects = await this.prisma.project.findMany({
      where: { creatorId, deletedAt: null },
      include: {
        projectPromotions: {
          select: {
            promotionId: true,
            status: true,
            promotion: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (projects.length === 0) {
      return [];
    }

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      creatorId: p.creatorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      promotions: p.projectPromotions.map((pp) => ({
        id: pp.promotionId,
        name: pp.promotion.name,
        status: pp.status,
      })),
    }));
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

  async findProjectsForStudent(studentId: number, page: number, size: number): Promise<ProjectsByPromotion> {
    if (studentId == null) {
      throw new BadRequestException("studentId is required");
    }

    const studentPromos = await this.prisma.studentPromotion.findMany({
      where: { userId: studentId },
      select: { promotionId: true },
    });
    const promotionIds = studentPromos.map((sp) => sp.promotionId);
    if (promotionIds.length === 0) {
      return {};
    }

    const links = await this.prisma.projectPromotion.findMany({
      where: { promotionId: { in: promotionIds } },
      include: { project: true },
    });

    const byPromos: Record<number, Project[]> = {};
    for (const pid of promotionIds) {
      byPromos[pid] = [];
    }
    for (const link of links) {
      const p = link.project;
      byPromos[link.promotionId].push({
        id: p.id,
        name: p.name,
        description: p.description,
        creatorId: p.creatorId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }

    const tasks = promotionIds.map((pid) => {
      const allProjects = byPromos[pid];
      const totalRecords = allProjects.length;
      const totalPages = Math.ceil(totalRecords / size);
      const start = (page - 1) * size;
      const pageProjects = allProjects.slice(start, start + size);

      return Promise.all(
        pageProjects.map((proj) =>
          this.prisma.groupSettings
            .findMany({
              where: { projectId: proj.id, promotionId: pid },
              include: {
                projectPromotion: {
                  include: { groups: { include: { members: true } } },
                },
              },
            })
            .then((settings) => {
              const groups = settings.flatMap((gs) => gs.projectPromotion.groups);

              let status: GroupStatus = "no_groups";
              let ownGroup: Group | undefined;

              if (groups.length > 0) {
                const found = groups.find((g) => g.members.some((m) => m.studentId === studentId));
                status = found ? "in_group" : "not_in_group";
                if (found) {
                  ownGroup = {
                    id: found.id,
                    name: found.name,
                    members: found.members.map((m) => ({
                      studentId: m.studentId,
                    })),
                  };
                }
              }

              return { project: proj, groupStatus: status, group: ownGroup };
            }),
        ),
      ).then((enriched) => {
        const meta: PaginationMeta = {
          totalRecords,
          currentPage: page,
          totalPages,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        };
        return [pid, { data: enriched, pagination: meta }] as const;
      });
    });

    const entries = await Promise.all(tasks);

    return Object.fromEntries(entries) as ProjectsByPromotion;
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
