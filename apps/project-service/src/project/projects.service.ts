import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProjectStatus } from "@prisma-project/client";
import { GroupMode } from "@/groups/dto/group.dto";
import { Paginated, PaginationMeta } from "@/interfaces/pagination.interface";
import { PrismaService } from "@/prisma.service";
import { CreateProjectDto, GroupSettingDto } from "./dto/create-project.dto";
import { ProjectStatisticsDto } from "./dto/project-statistics.dto";
import { ProjectStudentDto } from "./dto/project-student.dto";
import { ProjectTeacherDto } from "./dto/project-teacher.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

export type GroupStatus = "no_groups" | "not_in_group" | "in_group";

export interface Project {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  hasReport: boolean;
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
  hasReport: boolean;
  createdAt: Date;
  updatedAt: Date;
  promotions: Array<{
    id: number;
    name: string;
    status: ProjectStatus;
  }>;
}

export type ProjectsByPromotion = Record<number, Paginated<ProjectWithGroupStatus>>;

export interface getAllStudentProjects {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  hasReport: boolean;
  createdAt: Date;
  updatedAt: Date;
  group: {
    id: number;
    name: string;
  } | null;
  promotion: {
    id: number;
    name: string;
  };
}

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProjectDto): Promise<{ project: Project; groups: Group[] }> {
    const { name, description, creatorId, hasReport = true, promotionIds = [], groupSettings = [] } = createDto;

    this.validateBasics(name, description, creatorId);
    await this.validatePromotions(promotionIds);
    this.validateGroupSettings(promotionIds, groupSettings);

    return this.prisma.$transaction(async (tx) => {
      const project = await this.createProject(tx, name, description, creatorId, hasReport);

      await this.createProjectPromotions(tx, project.id, promotionIds);
      await this.createGroupSettings(tx, project.id, groupSettings);

      const tasks = groupSettings.map((gs) =>
        gs.mode === GroupMode.RANDOM
          ? this.generateRandomGroups(tx, project.id, gs)
          : this.generateSkeletonGroups(tx, project.id, gs),
      );

      await Promise.all(tasks);

      const promoIdsForGroups = [...new Set(groupSettings.map((gs) => gs.promotionId))];

      const groups =
        promoIdsForGroups.length > 0
          ? await tx.group.findMany({
              where: {
                projectId: project.id,
                promotionId: { in: promoIdsForGroups },
              },
              include: { members: { select: { studentId: true } } },
            })
          : [];

      return { project, groups };
    });
  }

  async findByCreator(creator: number, page: number, size: number): Promise<Paginated<ProjectWithPromotions>> {
    if (creator == null) {
      throw new BadRequestException("creatorId is required");
    }

    const creatorId = Number(creator);

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
      hasReport: p.hasReport,
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

  async getProjectInfoTeacher(projectId: number, userId: number): Promise<ProjectTeacherDto> {
    try {
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          creatorId: userId,
          deletedAt: null,
        },
      });

      if (!project) {
        throw new Error("Project not found or you are not authorized to access it");
      }

      const projectData = await this.prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          projectPromotions: {
            include: {
              promotion: true,
            },
          },
        },
      });

      if (!projectData) {
        throw new Error("Project not found");
      }

      const result: ProjectTeacherDto = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        creatorId: projectData.creatorId,
        hasReport: projectData.hasReport,
        createdAt: projectData.createdAt.toISOString(),
        updatedAt: projectData.updatedAt.toISOString(),
        deletedAt: projectData.deletedAt?.toISOString() || null,
        promotions: projectData.projectPromotions.map((projectPromotion) => ({
          id: projectPromotion.promotion.id,
          name: projectPromotion.promotion.name,
          description: projectPromotion.promotion.description,
          status: projectPromotion.status,
        })),
      };

      return result;
    } catch (error) {
      console.error("Error fetching project info for teacher:", error);
      throw new Error("Failed to fetch project information");
    }
  }

  async getProjectInfoStudent(projectId: number, userId: number): Promise<ProjectStudentDto> {
    await this.prisma.project.findUniqueOrThrow({
      where: {
        id: projectId,
      },
    });

    const projectPromotion = await this.prisma.projectPromotion.findFirst({
      where: {
        projectId,
        status: ProjectStatus.VISIBLE,
        promotion: {
          studentPromotions: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!projectPromotion) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const projectData = await this.prisma.project.findUniqueOrThrow({
      where: {
        id: projectId,
      },
      include: {
        projectPromotions: {
          where: {
            status: ProjectStatus.VISIBLE,
          },
          include: {
            promotion: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const result: ProjectStudentDto = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      creatorId: projectData.creatorId,
      hasReport: projectData.hasReport,
      createdAt: projectData.createdAt.toISOString(),
      updatedAt: projectData.updatedAt.toISOString(),
      deletedAt: projectData.deletedAt?.toISOString() || null,
      promotionId: projectPromotion.promotionId,
    };

    return result;
  }

  private async getStudentProjectCount(studentId: number): Promise<number> {
    return this.prisma.projectPromotion.count({
      where: {
        status: "VISIBLE",
        promotion: {
          studentPromotions: {
            some: {
              userId: studentId,
            },
          },
        },
      },
    });
  }

  private async getPaginationMeta(
    totalRecords: number,
    currentPage: number,
    pageSize: number,
  ): Promise<PaginationMeta> {
    const totalPages = Math.ceil(totalRecords / pageSize);
    return {
      totalRecords,
      currentPage,
      totalPages,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    };
  }

  async findProjectsForStudent(
    studentId: number,
    currentPage: number,
    pageSize: number,
  ): Promise<Paginated<getAllStudentProjects>> {
    const skip = (currentPage - 1) * pageSize;

    try {
      const totalRecords = await this.getStudentProjectCount(studentId);

      const projectPromotions = await this.prisma.projectPromotion.findMany({
        where: {
          status: "VISIBLE",
          promotion: {
            studentPromotions: {
              some: {
                userId: studentId,
              },
            },
          },
        },
        include: {
          project: true,
          promotion: true,
          groups: {
            where: {
              members: {
                some: {
                  studentId,
                },
              },
            },
            take: 1,
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      });

      const data: getAllStudentProjects[] = projectPromotions.map((projectPromotion) => {
        const studentGroup = projectPromotion.groups[0] || null;

        return {
          id: projectPromotion.project.id,
          name: projectPromotion.project.name,
          description: projectPromotion.project.description,
          creatorId: projectPromotion.project.creatorId,
          hasReport: projectPromotion.project.hasReport,
          createdAt: projectPromotion.project.createdAt,
          updatedAt: projectPromotion.project.updatedAt,
          group: studentGroup
            ? {
                id: studentGroup.id,
                name: studentGroup.name,
              }
            : null,
          promotion: {
            id: projectPromotion.promotion.id,
            name: projectPromotion.promotion.name,
          },
        };
      });

      const pagination = await this.getPaginationMeta(totalRecords, currentPage, pageSize);

      return {
        data,
        pagination,
      };
    } catch (error) {
      console.error("Error fetching student projects:", error);
      throw new Error("Failed to fetch student projects");
    }
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
    if (updateDto.hasReport !== undefined) data.hasReport = updateDto.hasReport;

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

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.projectPromotion.deleteMany({
        where: { projectId: id },
      });
    });

    return { deleted: true };
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private validateBasics(name: string, description: string, creatorId: number) {
    if (!(name && description && creatorId)) {
      throw new BadRequestException("name, description and creatorId are required");
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
      throw new BadRequestException(`Invalid group settings for promotions: ${invalid.join(", ")}`);
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

  private createProject(
    tx: Prisma.TransactionClient,
    name: string,
    description: string,
    creatorId: number,
    hasReport: boolean,
  ) {
    return tx.project.create({
      data: { name, description, creatorId, hasReport },
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

  async getStatistics(userId: number, userRole: "TEACHER" | "ADMIN" | "STUDENT"): Promise<ProjectStatisticsDto> {
    if (userRole === "TEACHER" || userRole === "ADMIN") {
      const [totalProjects, activeProjects, draftProjects, hiddenProjects, totalPromotions] = await Promise.all([
        this.prisma.project.count({
          where: { creatorId: userId, deletedAt: null },
        }),
        this.prisma.projectPromotion.count({
          where: { project: { creatorId: userId, deletedAt: null }, status: "VISIBLE" },
        }),
        this.prisma.projectPromotion.count({
          where: { project: { creatorId: userId, deletedAt: null }, status: "DRAFT" },
        }),
        this.prisma.projectPromotion.count({
          where: { project: { creatorId: userId, deletedAt: null }, status: "HIDDEN" },
        }),
        this.prisma.promotion.count({
          where: { creatorId: userId },
        }),
      ]);

      return {
        totalProjects,
        activeProjects,
        draftProjects,
        hiddenProjects,
        totalPromotions,
      };
    }
    const [participantProjects, groupMemberships, totalPromotions] = await Promise.all([
      this.prisma.projectPromotion.count({
        where: {
          status: "VISIBLE",
          promotion: {
            studentPromotions: {
              some: { userId },
            },
          },
        },
      }),
      this.prisma.groupMember.count({
        where: { studentId: userId },
      }),
      this.prisma.studentPromotion.count({
        where: { userId },
      }),
    ]);

    return {
      totalProjects: 0,
      activeProjects: 0,
      draftProjects: 0,
      hiddenProjects: 0,
      totalPromotions,
      participantProjects,
      groupMemberships,
    };
  }
}
