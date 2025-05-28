import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProjectStatus } from "@prisma-project/client";
import { JwtUser } from "@/common/decorators/get-user.decorator";
import { GroupMode } from "@/groups/dto/group.dto";
import { Paginated, PaginationMeta } from "@/interfaces/pagination.interface";
import { PrismaService } from "@/prisma.service";
import { GroupDto, GroupMemberDto, ProjectDetailedDto, PromotionInfo } from "@/project/dto/project-detailed.dto";
import { CreateProjectDto, GroupSettingDto } from "./dto/create-project.dto";
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

  async create(createDto: CreateProjectDto) {
    const { name, description, creatorId, promotionIds = [], groupSettings = [] } = createDto;

    this.validateBasics(name, description, creatorId);
    await this.validatePromotions(promotionIds);
    this.validateGroupSettings(promotionIds, groupSettings);

    return this.prisma.$transaction(async (tx) => {
      const project = await this.createProject(tx, name, description, creatorId);

      await this.createProjectPromotions(tx, project.id, promotionIds);
      await this.createGroupSettings(tx, project.id, groupSettings);

      const tasks = groupSettings.map((gs) =>
        gs.mode === GroupMode.RANDOM
          ? this.generateRandomGroups(tx, project.id, gs)
          : this.generateSkeletonGroups(tx, project.id, gs),
      );

      await Promise.all(tasks);

      return project;
    });
  }

  async findByCreator(creatorId: number, page: number, size: number): Promise<Paginated<ProjectWithPromotions>> {
    if (creatorId == null) {
      throw new BadRequestException("creatorId is required");
    }

    const totalRecords = await this.prisma.project.count({
      where: { creatorId, deletedAt: null },
    });

    const projects = await this.prisma.project.findMany({
      where: { creatorId, deletedAt: null },
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: "desc" },
      include: {
        projectPromotions: {
          select: {
            promotionId: true,
            status: true,
            promotion: { select: { name: true } },
          },
        },
      },
    });

    const data: ProjectWithPromotions[] = projects.map((p) => ({
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

    const totalPages = Math.ceil(totalRecords / size) || 1;
    const meta: PaginationMeta = {
      totalRecords,
      currentPage: page,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return { data, pagination: meta };
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

  async findOneDetailed(id: number, user: JwtUser): Promise<ProjectDetailedDto> {
    const project = await this.prisma.project.findUnique({
      where: { id, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    const dto: ProjectDetailedDto = {
      id: project.id,
      name: project.name,
      description: project.description,
    };

    if (user.role === "TEACHER" || user.role === "ADMIN") {
      const pps = await this.prisma.projectPromotion.findMany({
        where: { projectId: id },
        include: { promotion: true },
      });
      dto.promotions = pps.map(
        (pp): PromotionInfo => ({
          id: pp.promotionId,
          name: pp.promotion.name,
          status: pp.status,
        }),
      );

      const groups = await this.prisma.group.findMany({
        where: { projectId: id },
        include: { members: true },
      });
      dto.groups = groups.map(
        (g): GroupDto => ({
          id: g.id,
          name: g.name,
          members: g.members.map((m): GroupMemberDto => ({ studentId: m.studentId })),
        }),
      );
    } /* STUDENT */ else {
      const membership = await this.prisma.groupMember.findFirst({
        where: {
          studentId: user.sub,
          group: { projectId: id },
        },
        include: {
          group: {
            include: { members: true },
          },
        },
      });
      if (membership) {
        const g = membership.group;
        dto.groups = [
          {
            id: g.id,
            name: g.name,
            members: g.members.map((m) => ({ studentId: m.studentId })),
          },
        ];
      } else {
        dto.groups = [];
      }
    }

    return dto;
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

  // ─── Private helpers ─────────────────────────────────────────────────

  private validateBasics(name: string, description: string, creatorId: number) {
    if (!(name && description && creatorId)) {
      throw new BadRequestException("name, description et creatorId sont requis");
    }
  }

  private async validatePromotions(promotionIds: number[]) {
    if (promotionIds.length === 0) return;
    const found = await this.prisma.promotion.findMany({
      where: { id: { in: promotionIds } },
      select: { id: true },
    });
    const foundIds = found.map((p) => p.id);
    const missing = promotionIds.filter((id) => !foundIds.includes(id));
    if (missing.length) {
      throw new BadRequestException(`Promotions not found : ${missing.join(", ")}`);
    }
  }

  private validateGroupSettings(promotionIds: number[], groupSettings: GroupSettingDto[]) {
    if (groupSettings.length === 0) return;
    const invalid = groupSettings.map((gs) => gs.promotionId).filter((pid) => !promotionIds.includes(pid));
    if (invalid.length) {
      throw new BadRequestException(`GroupSettings invalides pour promotions : ${invalid.join(", ")}`);
    }
    for (const { minMembers, maxMembers, deadline } of groupSettings) {
      if (minMembers > maxMembers) {
        throw new BadRequestException("minMembers cannot be greater than maxMembers");
      }
      if (new Date(deadline) < new Date()) {
        throw new BadRequestException("Deadline must be in the future");
      }
    }
  }

  private createProject(tx: Prisma.TransactionClient, name: string, description: string, creatorId: number) {
    return tx.project.create({
      data: { name, description, creatorId },
    });
  }

  private createProjectPromotions(tx: Prisma.TransactionClient, projectId: number, promotionIds: number[]) {
    if (!promotionIds.length) return Promise.resolve();
    return tx.projectPromotion.createMany({
      data: promotionIds.map((promotionId) => ({
        projectId,
        promotionId,
        status: ProjectStatus.DRAFT,
      })),
    });
  }

  private createGroupSettings(tx: Prisma.TransactionClient, projectId: number, groupSettings: GroupSettingDto[]) {
    if (!groupSettings.length) return Promise.resolve();
    return tx.groupSettings.createMany({
      data: groupSettings.map((gs) => ({
        projectId,
        promotionId: gs.promotionId,
        minMembers: gs.minMembers,
        maxMembers: gs.maxMembers,
        mode: gs.mode,
        deadline: new Date(gs.deadline),
      })),
    });
  }

  /**
   * RANDOM mode:
   *  - fetch all student IDs for the promotion
   *  - shuffle them
   *  - compute number of groups = ceil(count/maxMembers), at least 1
   *  - create each group, then assign the slice of student IDs to that group
   */
  private async generateRandomGroups(tx: Prisma.TransactionClient, projectId: number, gs: GroupSettingDto) {
    const students = await tx.studentPromotion.findMany({
      where: { promotionId: gs.promotionId },
      select: { userId: true },
    });
    const ids = students.map((s) => s.userId);

    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    const count = ids.length;
    const numGroups = Math.max(1, Math.ceil(count / gs.maxMembers));
    const chunkSize = Math.ceil(count / numGroups) || count || 1;

    const createGroupPromises = Array.from({ length: numGroups }, (_, idx) =>
      tx.group.create({
        data: {
          projectId,
          promotionId: gs.promotionId,
          name: `Groupe ${idx + 1}`,
        },
      }),
    );
    const createdGroups = await Promise.all(createGroupPromises);

    const memberPromises = createdGroups.map((group, idx) => {
      const slice = ids.slice(idx * chunkSize, (idx + 1) * chunkSize);
      if (slice.length === 0) {
        return Promise.resolve();
      }
      return tx.groupMember.createMany({
        data: slice.map((studentId) => ({
          groupId: group.id,
          studentId,
        })),
      });
    });
    await Promise.all(memberPromises);
  }

  /**
   * MANUAL & FREE modes:
   *  - compute number of skeleton groups
   *    – FREE → ceil(studentCount/minMembers)
   *    – MANUAL → ceil(studentCount/maxMembers)
   *  - create empty groups, students will join later
   */
  private async generateSkeletonGroups(tx: Prisma.TransactionClient, projectId: number, gs: GroupSettingDto) {
    const studentCount = await tx.studentPromotion.count({
      where: { promotionId: gs.promotionId },
    });

    let numGroups: number;
    if (gs.mode === GroupMode.FREE) {
      numGroups = Math.max(1, Math.ceil(studentCount / gs.minMembers));
    } else {
      numGroups = Math.max(1, Math.ceil(studentCount / gs.maxMembers));
    }

    const skeletons = Array.from({ length: numGroups }, (_, i) => ({
      projectId,
      promotionId: gs.promotionId,
      name: `Groupe ${i + 1}`,
    }));
    await tx.group.createMany({ data: skeletons });
  }
}
