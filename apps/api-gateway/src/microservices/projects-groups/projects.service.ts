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
   * Récupère pour un étudiant tous ses projets classés par promotion,
   * avec le statut de groupe (aucun groupe, pas dans un groupe, ou son groupe).
   */
  async findProjectsForStudent(studentId: number): Promise<Record<number, ProjectWithGroupStatus[]>> {
    if (!studentId) throw new BadRequestException("studentId is required");

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

    const entries = await Promise.all(
      promotionIds.map(async (pid) => {
        const projects = byPromos[pid] ?? [];
        const enriched = await Promise.all(
          projects.map(async (proj) => {
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
        return [pid, enriched] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<number, ProjectWithGroupStatus[]>;
  }
}
