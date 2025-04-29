import { BadRequestException, Injectable } from "@nestjs/common";
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

@Injectable()
export class ProjectsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  /**
   * Récupère pour un étudiant donné tous ses projets classés par promotion,
   * avec le statut de groupe et pagination per promotion.
   */
  async findProjectsForStudent(
    studentId: number,
    page = 1,
    size = 10,
  ): Promise<Record<number, ProjectWithGroupStatus[]>> {
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

    const allResults = await Promise.all(
      promotionIds.map(async (pid) => {
        const projects = byPromos[pid] ?? [];
        const start = (page - 1) * size;
        const pageProjects = projects.slice(start, start + size);

        const enriched = await Promise.all(
          pageProjects.map(async (proj) => {
            const groups = await this.proxy.forwardRequest<Group[]>(
              "group",
              `/projects/${proj.id}/promotions/${pid}/groups`,
              "GET",
            );
            let status: GroupStatus;
            let ownGroup: Group | undefined;
            if (!groups || groups.length === 0) {
              status = "no_groups";
            } else {
              const found = groups.find((g) => g.members.some((m) => m.studentId === studentId));
              if (found) {
                status = "in_group";
                ownGroup = found;
              } else {
                status = "not_in_group";
              }
            }
            return { project: proj, groupStatus: status, group: ownGroup };
          }),
        );

        return { pid, enriched };
      }),
    );

    const result: Record<number, ProjectWithGroupStatus[]> = {};
    for (const { pid, enriched } of allResults) {
      result[pid] = enriched;
    }
    return result;
  }
}
