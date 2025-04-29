import { BadRequestException, Injectable } from "@nestjs/common";
import { Paginated, PaginationMeta } from "@/common/interfaces/pagination.interface.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export interface Project {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Group {
  id: number;
  name?: string;
  members: Array<{ studentId: number }>;
}

export type GroupStatus = "no_groups" | "not_in_group" | "in_group";

export interface ProjectWithGroupStatus {
  project: Project;
  groupStatus: GroupStatus;
  group?: Group;
}

export type ProjectsByPromotion = Record<number, Paginated<ProjectWithGroupStatus>>;

@Injectable()
export class ProjectsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  async findProjectsForStudent(studentId: number, page = 1, size = 10): Promise<ProjectsByPromotion> {
    if (!studentId) throw new BadRequestException("studentId is required");
    if (page < 1 || size < 1) throw new BadRequestException("page and size must be positive integers");

    const promotions = await this.proxy.forwardRequest<Array<{ id: number }>>(
      "project",
      `/promotions/student/${studentId}`,
      "GET",
    );
    const promotionIds = promotions.map((p) => p.id);
    if (promotionIds.length === 0) return {};

    const byPromos = await this.proxy.forwardRequest<Record<string, Project[]>>(
      "project",
      "/projects/by-promotions",
      "GET",
      undefined,
      { promotionIds: promotionIds.join(",") },
    );

    const result: ProjectsByPromotion = {};

    await Promise.all(
      promotionIds.map(async (pid) => {
        const allProjects = byPromos[pid] ?? [];
        const totalRecords = allProjects.length;
        const totalPages = Math.ceil(totalRecords / size);
        const start = (page - 1) * size;
        const pageProjects = allProjects.slice(start, start + size);

        const enriched = await Promise.all(
          pageProjects.map(async (proj) => {
            const groups = await this.proxy.forwardRequest<Group[]>(
              "group",
              `/projects/${proj.id}/promotions/${pid}/groups`,
              "GET",
            );
            let status: GroupStatus;
            let ownGroup: Group | undefined;
            if (!groups.length) {
              status = "no_groups";
            } else {
              const found = groups.find((g) => g.members.some((m) => m.studentId === studentId));
              status = found ? "in_group" : "not_in_group";
              ownGroup = found;
            }
            return { project: proj, groupStatus: status, group: ownGroup };
          }),
        );

        const meta: PaginationMeta = {
          totalRecords,
          currentPage: page,
          totalPages,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        };

        result[pid] = { data: enriched, pagination: meta };
      }),
    );

    return result;
  }
}
